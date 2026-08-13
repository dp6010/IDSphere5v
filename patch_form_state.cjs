const fs = require('fs');
let code = fs.readFileSync('src/pages/Forms.tsx', 'utf8');

// 1. Update the state declaration and handlers
const oldState = `  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  
  const confirmDelete = async () => {
    if (!formToDelete || !user?.email || !org) return;
    setDeletingId(formToDelete);
    try {
      await apiClient.deleteForm(user.email, org.organizationId, formToDelete);
      setForms(prev => prev.filter(f => f.formId !== formToDelete));
      alert("Form deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete form: " + err.message);
    } finally {
      setDeletingId(null);
      setFormToDelete(null);
    }
  };

  const handleDeleteClick = (formId: string) => {
    setFormToDelete(formId);
  };`;

const newState = `  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  
  const confirmDelete = async () => {
    if (!formToDelete || !user?.email || !org) return;
    setDeletingId(formToDelete.formId);
    try {
      await apiClient.deleteForm(user.email, org.organizationId, formToDelete.formId);
      setForms(prev => prev.filter(f => f.formId !== formToDelete.formId));
      alert("Form deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete form: " + err.message);
    } finally {
      setDeletingId(null);
      setFormToDelete(null);
    }
  };

  const handleDeleteClick = (form: Form) => {
    setFormToDelete(form);
  };`;

code = code.replace(oldState, newState);

// 2. Update the button onClick handler
code = code.replace(/onClick=\{\(\) => handleDeleteClick\(form\.formId\)\}/g, "onClick={() => handleDeleteClick(form)}");

// 3. Update the modal references
code = code.replace(/deletingId === formToDelete/g, "deletingId === formToDelete?.formId");

fs.writeFileSync('src/pages/Forms.tsx', code);
