import { TrendingUp, Target, BarChart3 } from 'lucide-react'

export default function KPIs() {
  const kpis = [
    { id: 'KPI01', name: 'Mobilisation & Project Deadlines', category: 'Time Performance', target: 90, current: null },
    { id: 'KPI02', name: 'Timeliness of Delivery', category: 'Time Performance', target: 90, current: null },
    { id: 'KPI03', name: 'First Time Quality of Deliverables', category: 'Time Performance', target: 90, current: null },
    { id: 'KPI04', name: 'Second Time Quality of Deliverables', category: 'Quality of Collaboration', target: 95, current: null },
    { id: 'KPI05', name: 'Proactive Partnership', category: 'Quality of Collaboration', target: 90, current: null },
    { id: 'KPI06', name: 'Responsiveness', category: 'Quality of Collaboration', target: 90, current: null },
    { id: 'KPI07', name: 'Communication & Collaboration', category: 'Quality of Collaboration', target: 90, current: null },
    { id: 'KPI08', name: 'Planning & Reporting', category: 'Delivery Performance', target: 90, current: null },
    { id: 'KPI09', name: 'Documentation Quality', category: 'Delivery Performance', target: 95, current: null },
    { id: 'KPI10', name: 'Risk Management', category: 'Delivery Performance', target: 90, current: null },
    { id: 'KPI11', name: 'Innovation & Improvement', category: 'Delivery Performance', target: 90, current: null }
  ]

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Key Performance Indicators</h2>
          <button className="btn btn-primary">
            <TrendingUp size={20} />
            Update KPIs
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>KPI ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Target</th>
                <th>Current</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => (
                <tr key={kpi.id}>
                  <td>{kpi.id}</td>
                  <td>{kpi.name}</td>
                  <td>{kpi.category}</td>
                  <td>{kpi.target}%</td>
                  <td>{kpi.current || '-'}</td>
                  <td>
                    <span className="badge badge-info">Not Measured</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
