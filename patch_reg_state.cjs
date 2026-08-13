const fs = require('fs');
let code = fs.readFileSync('src/pages/Registrations.tsx', 'utf8');

// 1. Update the state declaration and handlers
const oldState = `  const [regToDelete, setRegToDelete] = useState<string | null>(null);
  
  const confirmDelete = async () => {
    if (!regToDelete || !user?.email || !org) return;
    setDeletingId(regToDelete);
    try {
      await apiClient.deleteRegistration(user.email, org.organizationId, regToDelete);
      setRegistrations(prev => prev.filter(r => r.registrationId !== regToDelete));
      if (selectedReg?.registrationId === regToDelete) {
        setSelectedReg(null);
      }
      alert("Registration deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete registration: " + err.message);
    } finally {
      setDeletingId(null);
      setRegToDelete(null);
    }
  };

  const handleDeleteClick = (regId: string) => {
    setRegToDelete(regId);
  };`;

const newState = `  const [regToDelete, setRegToDelete] = useState<Registration | null>(null);
  
  const confirmDelete = async () => {
    if (!regToDelete || !user?.email || !org) return;
    setDeletingId(regToDelete.registrationId);
    try {
      await apiClient.deleteRegistration(user.email, org.organizationId, regToDelete.registrationId);
      setRegistrations(prev => prev.filter(r => r.registrationId !== regToDelete.registrationId));
      if (selectedReg?.registrationId === regToDelete.registrationId) {
        setSelectedReg(null);
      }
      alert("Registration deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete registration: " + err.message);
    } finally {
      setDeletingId(null);
      setRegToDelete(null);
    }
  };

  const handleDeleteClick = (reg: Registration) => {
    setRegToDelete(reg);
  };`;

code = code.replace(oldState, newState);

// 2. Update the button onClick handler
code = code.replace(/onClick=\{\(\) => handleDeleteClick\(selectedReg\.registrationId\)\}/g, "onClick={() => handleDeleteClick(selectedReg)}");

// 3. Update the modal references
code = code.replace(/deletingId === regToDelete/g, "deletingId === regToDelete?.registrationId");

fs.writeFileSync('src/pages/Registrations.tsx', code);
