import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Edit2, Save, X, Target, AlertCircle } from 'lucide-react';

export default function KPIs() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchKPIs();
    fetchUserRole();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  }

  async function fetchKPIs() {
    try {
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .order('kpi_ref');
      
      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(kpi) {
    setEditingId(kpi.id);
    setEditForm({
      current_value: kpi.current_value,
      last_measured: new Date().toISOString().split('T')[0]
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('kpis')
        .update(editForm)
        .eq('id', id);

      if (error) throw error;
      
      await fetchKPIs();
      setEditingId(null);
      alert('KPI updated successfully!');
    } catch (error) {
      console.error('Error updating KPI:', error);
      alert('Failed to update KPI');
    }
  }

  const getStatusColor = (current, target) => {
    const performance = (current / target) * 100;
    if (performance >= 95) re
