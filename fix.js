const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'client/src/pages/Admin.tsx');
let code = fs.readFileSync(filepath, 'utf8');

const regex = /const REPORTS = useMemo\([\s\S]*?const \[reports, setReports\] = useState\(REPORTS\)/;

const newCode = `const [reports, setReports] = React.useState<any[]>([])
  const [reportsLoading, setReportsLoading] = React.useState(false)

  React.useEffect(() => {
    if (tab === 'reports') {
      setReportsLoading(true)
      getTickets().then(res => {
        setReports(res)
      }).catch(err => console.error(err))
      .finally(() => setReportsLoading(false))
    }
  }, [tab])

  const handleUpdateTicket = async (id: string, newStatus: string) => {
    try {
      const updated = await updateTicketStatus(id, newStatus)
      setReports(prev => prev.map(t => t._id === id ? updated : t))
    } catch(err) {
      alert('Failed to update ticket')
    }
  }`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync(filepath, code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find the target string via regex.");
}
