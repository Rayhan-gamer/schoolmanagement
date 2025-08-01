import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../App.css';
import '../Dashboard.css';

function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [section, setSection] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [showImage, setShowImage] = useState(true);
  const fetchData = async (endpoint) => {
    setShowImage(false);
    try {
      const res = await fetch(`http://localhost:5000/student/${user.id}/${endpoint}`);
      const result = await res.json();
      setData(result);
      setSection(endpoint);
      setEditIndex(null);
      setEditedData({});
    } catch (error) {
      alert('Failed to fetch data');
    }
  };

  const handleEdit = (idx) => {
    setEditIndex(idx);
    setEditedData({ ...data[idx] });
  };

  const handleChange = (e, key) => {
    setEditedData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/student/${user.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });
      if (res.ok) {
        alert('Update successful');
        fetchData('info');
      } else {
        alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error while updating');
    }
  };

  const getLetterGrade = (gpa) => {
    const g = parseFloat(gpa);
    if (g === 5.0) return 'A+';
    if (g >= 4.0) return 'A';
    if (g >= 3.5) return 'A-';
    if (g >= 3.0) return 'B';
    if (g >= 2.5) return 'C';
    if (g >= 2.0) return 'D';
    return 'F';
  };

  const formatHeader = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\bid\b/gi, 'ID')
      .replace(/\bgpa\b/gi, 'GPA')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderTable = () => {
    if (!data.length) return <p>No data found.</p>;

    let keys = Object.keys(data[0]);

    if (section === 'gpa') {
      keys = keys.filter((key) => key !== 'result_id');
      if (!keys.includes('letter_grade')) {
        keys.push('letter_grade');
      }
    }

    return (
      <div className="table-container">
        <h3 className="section-title">{section.replace('_', ' ').toUpperCase()}</h3>
        <table className="styled-table">
          <thead>
            <tr>
              {keys.map((key) => (
                <th key={key}>{formatHeader(key)}</th>
              ))}
              {section === 'info' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {keys.map((key) => (
                  <td key={key}>
                    {editIndex === idx && section === 'info' ? (
                      <input
                        type="text"
                        value={editedData[key] || ''}
                        onChange={(e) => handleChange(e, key)}
                      />
                    ) : key === 'letter_grade' && section === 'gpa' ? (
                      getLetterGrade(row.subject_gpa)
                    ) : key === 'date_of_birth' && row[key] ? (
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
                      <button onClick={handleSave} className="btn">Save</button>
                    ) : (
                      <button onClick={() => handleEdit(idx)} className="btn">Edit</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          {section === 'gpa' && (
            <tfoot>
              <tr>
                <td colSpan={keys.length - 1} className="font-bold text-right pr-2">Average GPA:</td>
                <td>
                  {(
                    data.reduce((sum, row) => sum + parseFloat(row.subject_gpa || 0), 0) /
                    data.length
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={keys.length - 1} className="font-bold text-right pr-2">Average Grade:</td>
                <td>{getLetterGrade(
                  data.reduce((sum, row) => sum + parseFloat(row.subject_gpa || 0), 0) /
                  data.length
                )}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Student Dashboard</h2>
      
      <div className="button-group">
        <button onClick={() => fetchData('info')} className="btn">Personal Info</button>
        <button onClick={() => fetchData('subjects')} className="btn">Class & Subjects</button>
        <button onClick={() => fetchData('gpa')} className="btn">GPA & Results</button>
        <button onClick={() => fetchData('guardians')} className="btn">Guardians</button>
      </div>
      {data.length > 0 && renderTable()}
      {showImage && (
        <img
          src="/studentDashboard.png"
          alt="Student Dashboard"
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
    
  );
}

export default StudentDashboard;
