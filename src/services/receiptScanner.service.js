/**
 * Receipt Scanner Service
 * 
 * Handles AI-powered receipt scanning, data extraction, and classification.
 * Integrates with Claude Vision API for OCR and intelligent parsing.
 * Implements learning system from user corrections.
 * 
 * @version 1.0
 * @created 2 December 2025
 * @phase Phase 2 - Smart Receipt Scanner
 */

import { supabase } from '../lib/supabase';

// Classification categories matching expense system
const EXPENSE_CATEGORIES = ['Travel', 'Accommodation', 'Sustenance'];

// Common merchant patterns for initial classification hints
const MERCHANT_HINTS = {
  // Travel
  'uber': 'Travel',
  'lyft': 'Travel',
  'taxi': 'Travel',
  'train': 'Travel',
  'rail': 'Travel',
  'airlines': 'Travel',
  'airways': 'Travel',
  'petrol': 'Travel',
  'gas station': 'Travel',
  'fuel': 'Travel',
  'parking': 'Travel',
  
  // Accommodation
  'hotel': 'Accommodation',
  'inn': 'Accommodation',
  'motel': 'Accommodation',
  'airbnb': 'Accommodation',
  'booking.com': 'Accommodation',
  'marriott': 'Accommodation',
  'hilton': 'Accommodation',
  'premier inn': 'Accommodation',
  'travelodge': 'Accommodation',
  
  // Sustenance
  'restaurant': 'Sustenance',
  'cafe': 'Sustenance',
  'coffee': 'Sustenance',
  'costa': 'Sustenance',
  'starbucks': 'Sustenance',
  'pret': 'Sustenance',
  'greggs': 'Sustenance',
  'mcdonald': 'Sustenance',
  'subway': 'Sustenance',
  'nando': 'Sustenance',
  'pizza': 'Sustenance',
  'pub': 'Sustenance',
  'bar': 'Sustenance',
  'food': 'Sustenance',
  'supermarket': 'Sustenance',
  'tesco': 'Sustenance',
  'sainsbury': 'Sustenance',
  'co-op': 'Sustenance',
  'waitrose': 'Sustenance',
  'aldi': 'Sustenance',
  'lidl': 'Sustenance'
};

class ReceiptScannerService {
  constructor() {
    this.bucketName = 'receipt-scans';
  }

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  /**
   * Upload receipt image to Supabase Storage
   * @param {File} file - Image file to upload
   * @param {string} userId - User ID for folder organization
   * @returns {Promise<{path: string, url: string}>}
   */
  async uploadImage(file, userId) {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Generate unique path
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const path = `${userId}/${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return { path, url: publicUrl };
    } catch (error) {
      console.error('ReceiptScannerService uploadImage error:', error);
      throw error;
    }
  }

  // =====================================================
  // AI PROCESSING
  // =====================================================

  /**
   * Process receipt image with Claude Vision API
   * @param {string} imageUrl - URL of the uploaded image
   * @param {string} projectId - Project context for classification rules
   * @returns {Promise<Object>} Extracted receipt data
   */
  async processReceipt(imageUrl, projectId) {
    const startTime = Date.now();
    
    try {
      // Convert image to base64 for API
      const imageData = await this.fetchImageAsBase64(imageUrl);
      
      // Call Claude Vision API
      const extractedData = await this.callClaudeVision(imageData);
      
      // Look for matching classification rule
      let classification = await this.findClassificationRule(
        projectId, 
        extractedData.merchant
      );

      // If no rule found, use AI suggestion or pattern matching
      if (!classification) {
        classification = this.classifyFromPatterns(extractedData.merchant);
        if (!classification && extractedData.aiSuggestedCategory) {
          classification = {
            category: extractedData.aiSuggestedCategory,
            confidence: extractedData.aiConfidence || 0.6
          };
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        ...extractedData,
        suggestedCategory: classification?.category || null,
        confidence: classification?.confidence || 0,
        ruleBasedClassification: classification?.ruleId ? true : false,
        processingTimeMs: processingTime
      };
    } catch (error) {
      console.error('ReceiptScannerService processReceipt error:', error);
      throw error;
    }
  }

  /**
   * Fetch image and convert to base64
   */
  async fetchImageAsBase64(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve({
            data: base64,
            mediaType: blob.type
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }

  /**
   * Call Claude Vision API for receipt analysis
   */
  async callClaudeVision(imageData) {
    // Note: This would call your backend API endpoint that proxies to Claude
    // For now, we'll use a mock response structure
    
    const prompt = `Analyze this receipt image and extract the following information in JSON format:
{
  "merchant": "Store/vendor name",
  "amount": 0.00,
  "currency": "GBP",
  "date": "YYYY-MM-DD",
  "items": [{"name": "item name", "quantity": 1, "price": 0.00}],
  "paymentMethod": "card/cash/unknown",
  "category": "Travel/Accommodation/Sustenance",
  "confidence": 0.0 to 1.0,
  "rawText": "All visible text from receipt"
}

If any field cannot be determined, use null. For the category, consider:
- Travel: transport, fuel, parking, flights, trains, taxis
- Accommodation: hotels, lodging, rentals
- Sustenance: food, drinks, restaurants, cafes, supermarkets

Be conservative with confidence - only use high values (>0.8) when very certain.`;

    try {
      // Call backend API endpoint
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          prompt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt with AI');
      }

      const result = await response.json();
      
      return {
        merchant: result.merchant,
        amount: result.amount,
        currency: result.currency || 'GBP',
        date: result.date,
        items: result.items || [],
        paymentMethod: result.paymentMethod,
        aiSuggestedCategory: result.category,
        aiConfidence: result.confidence,
        rawText: result.rawText
      };
    } catch (error) {
      console.error('Claude Vision API error:', error);
      // Return partial data on error
      return {
        merchant: null,
        amount: null,
        currency: 'GBP',
        date: null,
        items: [],
        paymentMethod: null,
        aiSuggestedCategory: null,
        aiConfidence: 0,
        rawText: null,
        error: error.message
      };
    }
  }

  // =====================================================
  // CLASSIFICATION & LEARNING
  // =====================================================

  /**
   * Find classification rule for a merchant
   */
  async findClassificationRule(projectId, merchant) {
    if (!merchant) return null;

    try {
      const { data, error } = await supabase
        .rpc('find_classification_rule', {
          p_project_id: projectId,
          p_merchant: merchant
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        return {
          ruleId: data[0].rule_id,
          category: data[0].category,
          subcategory: data[0].subcategory,
          defaultChargeable: data[0].default_chargeable,
          defaultProcurement: data[0].default_procurement,
          confidence: parseFloat(data[0].confidence)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error finding classification rule:', error);
      return null;
    }
  }

  /**
   * Classify from built-in patterns (fallback)
   */
  classifyFromPatterns(merchant) {
    if (!merchant) return null;
    
    const merchantLower = merchant.toLowerCase();
    
    for (const [pattern, category] of Object.entries(MERCHANT_HINTS)) {
      if (merchantLower.includes(pattern)) {
        return {
          category,
          confidence: 0.7,
          source: 'pattern'
        };
      }
    }
    
    return null;
  }

  /**
   * Save user's category selection (creates/updates rule)
   */
  async learnFromCorrection(projectId, merchant, category, userId, wasCorrection = false) {
    if (!merchant || !category) return null;

    try {
      const { data, error } = await supabase
        .rpc('upsert_classification_rule', {
          p_project_id: projectId,
          p_merchant: merchant,
          p_category: category,
          p_user_id: userId,
          p_was_correction: wasCorrection
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving classification rule:', error);
      return null;
    }
  }

  // =====================================================
  // DATABASE OPERATIONS
  // =====================================================

  /**
   * Create a new receipt scan record
   */
  async createScan(scanData) {
    try {
      const { data, error } = await supabase
        .from('receipt_scans')
        .insert({
          project_id: scanData.projectId,
          uploaded_by: scanData.userId,
          image_url: scanData.imageUrl,
          image_path: scanData.imagePath,
          raw_ocr_text: scanData.rawText,
          extracted_merchant: scanData.merchant,
          extracted_amount: scanData.amount,
          extracted_date: scanData.date,
          extracted_currency: scanData.currency,
          extracted_items: scanData.items,
          ai_suggested_category: scanData.suggestedCategory,
          ai_confidence: scanData.confidence,
          status: 'completed',
          processing_time_ms: scanData.processingTimeMs
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating receipt scan:', error);
      throw error;
    }
  }

  /**
   * Update scan with final classification
   */
  async updateScanClassification(scanId, category, wasCorrection = false) {
    try {
      const { data, error } = await supabase
        .from('receipt_scans')
        .update({
          final_category: category,
          user_corrected: wasCorrection
        })
        .eq('id', scanId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating scan classification:', error);
      throw error;
    }
  }

  /**
   * Link scan to expense
   */
  async linkToExpense(scanId, expenseId) {
    try {
      const { data, error } = await supabase
        .from('receipt_scans')
        .update({
          expense_id: expenseId,
          status: 'linked'
        })
        .eq('id', scanId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error linking scan to expense:', error);
      throw error;
    }
  }

  /**
   * Get recent scans for a project
   */
  async getRecentScans(projectId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('receipt_scans')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent scans:', error);
      return [];
    }
  }

  /**
   * Get unlinked scans (not yet converted to expenses)
   */
  async getUnlinkedScans(projectId) {
    try {
      const { data, error } = await supabase
        .from('receipt_scans')
        .select('*')
        .eq('project_id', projectId)
        .is('expense_id', null)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unlinked scans:', error);
      return [];
    }
  }

  /**
   * Get classification rules for a project
   */
  async getClassificationRules(projectId) {
    try {
      const { data, error } = await supabase
        .from('classification_rules')
        .select('*')
        .eq('project_id', projectId)
        .order('match_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching classification rules:', error);
      return [];
    }
  }

  /**
   * Delete a classification rule
   */
  async deleteClassificationRule(ruleId) {
    try {
      const { error } = await supabase
        .from('classification_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting classification rule:', error);
      return false;
    }
  }
}

// Export singleton instance
export const receiptScannerService = new ReceiptScannerService();
export default receiptScannerService;
