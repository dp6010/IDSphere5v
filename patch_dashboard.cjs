const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const target1 = `  const [emailConfigured, setEmailConfigured] = useState<boolean>(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{success: boolean, message: string} | null>(null);`;

code = code.replace(target1, "");

const target2 = `      apiClient.checkEmailStatus(user.email)
        .then(res => setEmailConfigured(res.configured))
        .catch(console.error);`;

code = code.replace(target2, "");

const target3 = `  const handleTestEmail = async () => {
    if (!user?.email) return;
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await apiClient.sendTestEmail(user.email);
      setEmailTestResult({ success: true, message: res.message || 'Email sent successfully.' });
    } catch (err: any) {
      setEmailTestResult({ success: false, message: err.message || 'Failed to send email.' });
    } finally {
      setTestingEmail(false);
    }
  };`;

code = code.replace(target3, "");

const target4 = `        <div className="p-6 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="text-slate-500" size={20} />
            <h2 className="text-lg font-medium text-slate-900">Email Integration</h2>
          </div>
          
          <div className="space-y-4 mt-4 text-sm text-slate-700">
             <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Provider</span>
                <span>Google Gmail SMTP</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium text-slate-900">Status</span>
                <span className={\`flex items-center gap-1 font-medium \${emailConfigured ? 'text-emerald-700' : 'text-slate-500'}\`}>
                  {emailConfigured ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {emailConfigured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
             <button
                onClick={handleTestEmail}
                disabled={testingEmail || !emailConfigured}
                className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
             >
                {testingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {testingEmail ? 'Sending...' : 'Send Test Email'}
             </button>

             {emailTestResult && (
               <div className={\`mt-3 p-3 rounded text-sm \${emailTestResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}\`}>
                 {emailTestResult.message}
               </div>
             )}
          </div>
        </div>`;

code = code.replace(target4, "");

code = code.replace(`import { Mail, CheckCircle2, XCircle, Loader2 } from 'lucide-react';`, "");

fs.writeFileSync('src/pages/Dashboard.tsx', code);
