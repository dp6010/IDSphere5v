import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Organization } from '../types';
import { Save, ArrowLeft, AlertCircle, CheckCircle2, ExternalLink, Plus, Trash2 } from 'lucide-react';

export function FormBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formId } = useParams();
  const isEditing = !!formId;
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [fields, setFields] = useState<string[]>(['Full Name', 'Date of Birth', 'Address', 'Phone Number']);
  const [newField, setNewField] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdForm, setCreatedForm] = useState<{formId: string, responderUri: string} | null>(null);

  useEffect(() => {
    if (user?.email) {
      apiClient.getOrganization(user.email).then(orgData => {
        setOrg(orgData);
        if (isEditing) {
          apiClient.getForms(user.email!, orgData.organizationId).then(forms => {
            const f = forms.find((f: any) => f.formId === formId);
            if (f) {
              setName(f.name);
              setFields(f.fields || ['Full Name', 'Date of Birth', 'Address', 'Phone Number']);
            } else {
              setError('Form not found');
            }
          });
        }
      }).catch(err => setError(err.message));
    }
  }, [user, isEditing, formId]);

  const handleSave = async () => {
    if (!name.trim()) return setError('Form name is required');
    if (!org) return;

    try {
      setSaving(true);
      setError(null);
      
      if (isEditing) {
        await apiClient.updateForm(user!.email!, org.organizationId, formId!, { name, fields });
        navigate('/forms');
      } else {
        const result = await apiClient.createForm(user!.email!, org.organizationId, { name, fields });
        setCreatedForm({
          formId: result.formId,
          responderUri: result.responderUri
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!org && !error) return <div className="p-8 text-center text-slate-500">Loading configuration...</div>;

  if (createdForm) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/forms')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Form Created</h1>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
            <CheckCircle2 size={48} className="text-green-500" />
            <h2 className="text-xl font-medium text-slate-900">Registration form created successfully.</h2>
            <p className="mt-2 text-slate-600 max-w-md">
              Your form is now active and ready to accept registrations. You can copy the public registration link from your Forms dashboard.
            </p>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-center">
             <button
              onClick={() => navigate('/forms')}
              className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
            >
              Return to Forms
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/forms')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold text-slate-900">{isEditing ? 'Edit Form' : 'Create New Registration Form'}</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-100 text-sm flex gap-2 items-start">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Form Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Student Registration 2026"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isEditing && (
            <p className="mt-2 text-xs text-slate-500">
              This will automatically create a new Google Form in your organization's Drive containing the fields below.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Form Fields</label>
          <div className="space-y-2 mb-4">
            {fields.map((field, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={field}
                  onChange={(e) => {
                    const newFields = [...fields];
                    newFields[index] = e.target.value;
                    setFields(newFields);
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const newFields = fields.filter((_, i) => i !== index);
                    setFields(newFields);
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg"
                  title="Remove Field"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              placeholder="New Field Name"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newField.trim()) {
                    setFields([...fields, newField.trim()]);
                    setNewField('');
                  }
                }
              }}
            />
            <button
              onClick={() => {
                if (newField.trim()) {
                  setFields([...fields, newField.trim()]);
                  setNewField('');
                }
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Add Field
            </button>
          </div>
        </div>
        
        {!isEditing && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800 flex gap-3">
            <AlertCircle size={20} className="shrink-0 text-amber-600" />
            <div>
              <strong>Photo Upload configuration:</strong>
              <p className="mt-1 opacity-90">After the form is created, you will be prompted to manually add the Photo file-upload question due to Google Forms API limitations.</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
          >
            <Save size={16} />
            {saving ? (isEditing ? 'Saving...' : 'Creating Google Form...') : (isEditing ? 'Save Changes' : 'Create Form')}
          </button>
        </div>
      </div>
    </div>
  );
}
