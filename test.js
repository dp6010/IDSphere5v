const res = await fetch("http://localhost:3000/api/public/organizations/test/forms/test/photo-session");
console.log(await res.json());
