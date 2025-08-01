import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../Dashboard.css';

function GuardianDashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [section, setSection] = useState('');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [showImage, setShowImage] = useState(true);
  const fetchData = async (endpoint) => {
    setShowImage(false);
    setSection(endpoint);
    if (endpoint === 'results') {
      try {
        const res = await fetch(`http://localhost:5000/guardian/${user.id}/children`);
        const childrenData = await res.json();
        setChildren(childrenData);
        setData([]);
        setSelectedChild(null);
      } catch (err) {
        alert('Failed to fetch children list');
      }
    } else {
      try {
        const res = await fetch(`http://localhost:5000/guardian/${user.id}/${endpoint}`);
        const result = await res.json();
        setData(result);
        setEditIndex(null);
        setEditedData({});
      } catch (err) {
        alert('Failed to fetch data');
      }
    }
  };

  const fetchResultsForChild = async (childId, childName) => {
    try {
      const res = await fetch(`http://localhost:5000/guardian/${user.id}/results/${childId}`);
      const result = await res.json();
      setData(result);
      setSelectedChild({ id: childId, name: childName });
    } catch (err) {
      alert('Failed to fetch results');
    }
  };

  const formatHeader = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\bid\b/gi, 'ID')
      .replace(/\bgpa\b/gi, 'GPA')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderTable = () => {
  if (!data.length) return <p className="no-data">No data found.</p>;

  const keys = Object.keys(data[0]).filter((key) => key !== 'result_id');

  const gpas = data.map((row) => parseFloat(row.subject_gpa)).filter(g => !isNaN(g));
  const avgGpa = gpas.length > 0 ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : null;

  return (
    <div className="table-container">
      {selectedChild && (
        <div className="child-info">
          <p><strong>Student ID:</strong> {selectedChild.id}</p>
          <p><strong>Name:</strong> {selectedChild.name}</p>
        </div>
      )}
      <h3 className="section-title">{section.replace('-', ' ').toUpperCase()}</h3>
      <table className="styled-table">
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key}>{formatHeader(key)}</th>
            ))}
            {section === 'info' && <th>Edit</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {keys.map((key) => (
                <td key={key}>
                  {editIndex === idx ? (
                    <input
                      type="text"
                      value={editedData[key] ?? row[key]}
                      onChange={(e) =>
                        setEditedData({ ...editedData, [key]: e.target.value })
                      }
                    />
                  ) : key.toLowerCase().includes('date') && row[key] ? (
                    (() => {
                      const date = new Date(row[key]);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}-${month}-${year}`;
                    })()
                  ) : (
                    row[key]
                  )}
                </td>
              ))}
              {section === 'info' && (
                <td>
                  {editIndex === idx ? (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/guardian/${user.id}/update`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(editedData),
                            });
                            if (res.ok) {
                              const updated = [...data];
                              updated[idx] = { ...updated[idx], ...editedData };
                              setData(updated);
                              setEditIndex(null);
                              setEditedData({});
                            } else {
                              alert('Update failed.');
                            }
                          } catch (err) {
                            alert('Server error.');
                          }
                        }}
                      >Save</button>
                      
                    </>
                  ) : (
                    <button onClick={() => { setEditIndex(idx); setEditedData(row); }}>Edit</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {avgGpa && (
        <div className="average-gpa">
          <strong>Average GPA:</strong> {avgGpa}
        </div>
      )}
    </div>
  );
};


  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Guardian Dashboard</h2>
      <div className="button-group">
        <button onClick={() => fetchData('info')} className="btn">My Info</button>
        <button onClick={() => fetchData('children')} className="btn">My Children</button>
        <button onClick={() => fetchData('results')} className="btn">Their Results</button>
        {showImage && (
        <img
          src="/guardianDashboard.png"
          alt="Guardian Dashboard"
          style={{
            maxWidth: '1000px',
            width: '100%',
            height: 'auto',
            borderRadius: '10px',
            marginTop: '20px'
          }}
        />
      )}
      </div>

      {section === 'results' && children.length > 0 && (
        <div className="dropdown-container">
          <label>Select Child:</label>
          <select onChange={(e) => {
            const idx = e.target.selectedIndex - 1;
            if (idx >= 0) {
              const child = children[idx];
              fetchResultsForChild(child.id, child.student_name);
            } else {
              setData([]);
              setSelectedChild(null);
            }
          }}>
            <option value="">-- Select --</option>
            {children.map((child, idx) => (
              <option key={idx} value={child.id}>
                {child.student_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {data.length > 0 && renderTable()}
    </div>
  );
}

export default GuardianDashboard;
