const fs = require('fs');
let code = fs.readFileSync('src/pages/PublicIdCard.tsx', 'utf8');

const oldCheck = `           {data.status === 'ACTIVE' ? (
             <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
               Active / Verified
             </span>
           ) : (
             <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
               {data.status}
             </span>
           )}`;

const newCheck = `           {(() => {
             const today = new Date().toISOString().split('T')[0];
             const isExpired = data.validTill && today > data.validTill;
             
             if (data.status === 'ACTIVE') {
               if (isExpired) {
                 return (
                   <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
                     ID Expired
                   </span>
                 );
               } else {
                 return (
                   <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
                     Active / Verified
                   </span>
                 );
               }
             }
             
             return (
               <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-8">
                 {data.status}
               </span>
             );
           })()}`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('src/pages/PublicIdCard.tsx', code);
