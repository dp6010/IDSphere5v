const fs = require('fs');
let code = fs.readFileSync('src/server/api.ts', 'utf8');

code = code.replace(
`    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server Error' });
    }
  });

    }
  };`,
`    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Server Error' });
    }
  });`
);

fs.writeFileSync('src/server/api.ts', code);
console.log("Fixed!");
