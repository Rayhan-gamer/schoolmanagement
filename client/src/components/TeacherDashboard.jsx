import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../App.css';
import '../Dashboard.css';

function TeacherDashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [section, setSection] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [showImage, setShowImage] = useState(true);
  const fetchData = async (endpoint) => {
    setShowImage(false);
    try {
      const res = await fetch(`http://localhost:5000/teacher/${user.id}/${endpoint}`);
      const result = await res.json();
      setData(result);
      setSection(endpoint);
      setEditIndex(null);
      setEditedData({});
    } catch (error) {
      alert('Failed to fetch data');
    }
  };

  const fetchClassWiseGpa = async (className) => {
    try {
      const res = await fetch(`http://localhost:5000/teacher/${user.id}/enter-gpa/${className}`);
      const result = await res.json();
      setData(result);
      setSelectedClass(className);
      setSection('enter-gpa');
      setEditIndex(null);
      setEditedData({});
    } catch (err) {
      alert('Failed to fetch GPA for class');
    }
  };

  const handleGpaClick = async () => {
    try {
      const res = await fetch(`http://localhost:5000/teacher/${user.id}/classes`);
      const result = await res.json();
      const classNames = result.map(c => c.class_id);
      setAvailableClasses(classNames);
      setSection('choose-class');
      setData([]);
    } catch (err) {
      alert('Failed to load classes');
    }
  };

  const handleEdit = (idx) => {
    const row = data[idx];
    setEditedData({
      result_id: row.result_id,
      subject_gpa: row.subject_gpa,
      subject_id: row.subject_id,
    });
    setEditIndex(idx);
  };

  const handleChange = (e, key) => {
    setEditedData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async () => {
    const url = section === 'info'
      ? `http://localhost:5000/teacher/${user.id}/update`
      : `http://localhost:5000/teacher/${user.id}/update-gpa`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });
      if (res.ok) {
        alert('Update successful');
        if (section === 'info') fetchData('info');
        else fetchClassWiseGpa(selectedClass);
      } else {
        alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error while updating');
    }
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
    if (!data.length) return <p className="no-data">No data found.</p>;

    const keys = Object.keys(data[0]).filter(key => key !== 'result_id');

    return (
      <div className="table-container">
        <h3 className="section-title">{(section === 'enter-gpa' ? `GPA - Class ${selectedClass}` : section).replace('-', ' ').toUpperCase()}</h3>
        <table className="styled-table">
          <thead>
            <tr>
              {keys.map((key) => (
                <th key={key}>{formatHeader(key)}</th>
              ))}
              {section === 'info' || section === 'enter-gpa' ? <th>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {keys.map((key) => (
                  <td key={key}>
                    {editIndex === idx && section === 'enter-gpa' && key === 'subject_gpa' ? (
                      <select
                        value={editedData.subject_gpa || ''}
                        onChange={(e) => handleChange(e, 'subject_gpa')}
                      >
                        <option value="5.0">A+</option>
                        <option value="4.0">A</option>
                        <option value="3.5">A-</option>
                        <option value="3.0">B</option>
                        <option value="2.5">C</option>
                        <option value="2.0">D</option>
                        <option value="0.0">F</option>
                      </select>
                    ) : editIndex === idx && section === 'info' ? (
                      <input
                        className="edit-input"
                        type="text"
                        value={editedData[key] || ''}
                        onChange={(e) => handleChange(e, key)}
                      />
                    ) : key.toLowerCase().includes('date') && row[key] ? (
                      (() => {
                        const date = new Date(row[key]);
                        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                      })()
                    ) : (
                      row[key]
                    )}
                  </td>
                ))}
                {(section === 'info' || section === 'enter-gpa') && (
                  <td>
                    {editIndex === idx ? (
                      <button onClick={handleSave} className="btn save-btn">Save</button>
                    ) : (
                      <button onClick={() => handleEdit(idx)} className="btn edit-btn">Edit</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Teacher Dashboard</h2>
      <div className="button-group">
        <button onClick={() => fetchData('info')} className="btn">Personal Info</button>
        <button onClick={() => fetchData('classes')} className="btn">Assigned Classes</button>
        <button onClick={handleGpaClick} className="btn">Student GPAs</button>
        {showImage && (
        <img
          src="/teacherDashboard.png"
          alt="Teacher Dashboard"
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

      {section === 'choose-class' && (
        <div className="class-select">
          <label>Select Class:&nbsp;</label>
          <select onChange={(e) => fetchClassWiseGpa(e.target.value)} defaultValue="">
            <option value="" disabled>Select a class</option>
            {availableClasses.map((cls, i) => (
              <option key={i} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      )}

      {data.length > 0 && renderTable()}
    </div>
  );
}

export default TeacherDashboard;
