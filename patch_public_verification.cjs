const fs = require('fs');
let code = fs.readFileSync('src/pages/PublicVerification.tsx', 'utf8');

const oldDestructure = `  const { orgName, formName, status, data, photoUrl } = verificationData;
  const isActive = status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className={\`px-6 py-8 text-center \${isActive ? 'bg-emerald-600' : 'bg-red-600'}\`}>
          {isActive ? (
             <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
          ) : (
             <XCircle className="w-16 h-16 text-white mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold text-white mb-1">
            {isActive ? 'Identity Verified' : 'Identity Not Active'}
          </h1>
          <p className="text-white/80 font-medium uppercase tracking-wider text-xs">{status}</p>
        </div>`;

const newDestructure = `  const { orgName, formName, status, validTill, data, photoUrl } = verificationData;
  
  const today = new Date().toISOString().split('T')[0];
  const isExpired = validTill && today > validTill;
  const isActive = status === 'ACTIVE' && !isExpired;
  
  let headerTitle = 'Identity Not Active';
  let headerColor = 'bg-red-600';
  let Icon = XCircle;
  let statusText = status;
  
  if (status === 'ACTIVE') {
    if (isExpired) {
      headerTitle = 'Identity Expired';
      headerColor = 'bg-red-600';
      statusText = 'ID EXPIRED';
    } else {
      headerTitle = 'Identity Verified';
      headerColor = 'bg-emerald-600';
      statusText = 'VALID ID';
      Icon = CheckCircle;
    }
  } else if (status === 'REJECTED') {
    headerTitle = 'Identity Invalid';
    statusText = 'INVALID ID';
  } else if (status === 'DEACTIVE') {
    headerTitle = 'Identity Inactive';
    statusText = 'ID INACTIVE';
  } else if (status === 'PENDING') {
    headerTitle = 'Pending Verification';
    headerColor = 'bg-yellow-500';
    statusText = 'ID PENDING VERIFICATION';
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className={\`px-6 py-8 text-center \${headerColor}\`}>
          <Icon className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-1">
            {headerTitle}
          </h1>
          <p className="text-white/80 font-medium uppercase tracking-wider text-xs">{statusText}</p>
        </div>`;

code = code.replace(oldDestructure, newDestructure);
fs.writeFileSync('src/pages/PublicVerification.tsx', code);
