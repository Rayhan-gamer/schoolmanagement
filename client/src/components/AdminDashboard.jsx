import { useState, useEffect } from 'react';
import '../Dashboard.css';

function AdminDashboard() {
  const [section, setSection] = useState('');
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [guardianAssignments, setGuardianAssignments] = useState([]);
  const [guardianRole, setGuardianRole] = useState('');
  const [showImage, setShowImage] = useState(true);
  const fetchGuardians = async () => {
    setShowImage(false);
    const res = await fetch('http://localhost:5000/admin/guardians');
    const data = await res.json();
    setGuardians(data);
  };

  const fetchStudents = async () => {
    const res = await fetch('http://localhost:5000/admin/students');
    const data = await res.json();
    setStudents(data);
  };

  const fetchGuardianAssignments = async () => {
    const res = await fetch('http://localhost:5000/admin/guardian-assignments');
    const data = await res.json();
    setGuardianAssignments(data);
  };

  const handleAssignGuardian = async () => {
    if (!selectedGuardian || !selectedStudent || !guardianRole) {
      return alert('Please select guardian, student, and specify role.');
    }

    const res = await fetch('http://localhost:5000/admin/assign-guardian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardian_id: selectedGuardian,
        student_id: selectedStudent,
        role: guardianRole
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert('Assignment successful');
      fetchGuardianAssignments();
      setGuardianRole('');
    } else {
      alert('Assignment failed');
    }
  };


  const fetchUsers = async () => {
    const res = await fetch('http://localhost:5000/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  const fetchTeachers = async () => {
    const res = await fetch('http://localhost:5000/admin/teachers');
    const data = await res.json();
    setTeachers(data);
  };

  const fetchClasses = async () => {
    const res = await fetch('http://localhost:5000/admin/classes');
    const data = await res.json();
    setClasses(data);
  };

  const fetchSubjects = async () => {
    const res = await fetch('http://localhost:5000/admin/subjects');
    const data = await res.json();
    setSubjects(data);
  };

  const fetchAssignments = async () => {
    const res = await fetch('http://localhost:5000/admin/assignments');
    const data = await res.json();
    setAssignments(data);
  };

  const handleDelete = async (user_id, role) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    const res = await fetch(`http://localhost:5000/admin/delete-user/${user_id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message);
      fetchUsers();
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedClass || !selectedSubject) {
      alert('Please select teacher, class, and subject.');
      return;
    }

    const res = await fetch('http://localhost:5000/admin/assign-teacher-class-subject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_id: selectedTeacher,
        class_name: selectedClass,
        subject_id: selectedSubject,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert('Assignment successful');
      fetchAssignments();
    } else {
      alert('Assignment failed');
    }
  };

  const handleEdit = async (user_id, role) => {
    const res = await fetch(`http://localhost:5000/admin/user-details/${role}/${user_id}`);
    const data = await res.json();
    setEditUser({ ...data, role, id: user_id });
  };

  const handleUpdate = async () => {
    const { id, role, ...updateData } = editUser;
    const res = await fetch(`http://localhost:5000/admin/update-user/${role}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    const data = await res.json();
    if (data.success) {
      alert('User updated successfully');
      setEditUser(null);
      fetchUsers();
    }
  };
  const [addRole, setAddRole] = useState('');
  const [addData, setAddData] = useState({});

  const handleAddUser = async () => {
    if (!addRole) return alert('Select a role');

    let endpoint = '';
    if (addRole === 'student') endpoint = 'add-student';
    else if (addRole === 'teacher') endpoint = 'add-teacher';
    else if (addRole === 'guardian') endpoint = 'add-guardian';

    try {
      const res = await fetch(`http://localhost:5000/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addData),
      });

      const result = await res.json();
      if (result.success) {
        alert(`${addRole} added successfully`);
        setAddRole('');
        setAddData({});
        fetchUsers();
      } else {
        alert('Failed to add user');
      }
    } catch (err) {
      console.error('Error adding user:', err);
      alert('Error adding user');
    }
  };

  useEffect(() => {
    if (section === 'users') fetchUsers();
    if (section === 'assign') {
      fetchTeachers();
      fetchClasses();
      fetchSubjects();
      fetchAssignments();
    }
    if (section === 'assignGuardian') {
      fetchGuardians();
      fetchStudents();
      fetchGuardianAssignments();
    }

  }, [section]);

  return (
    <div className="dashboard">
      <h2 className="dashboard-title"> Admin Dashboard</h2>
      <div className="button-group">
        <button onClick={() => setSection('users')} className="btn">Manage Users</button>
        <button onClick={() => setSection('assign')} className="btn">Assign Class & Subject</button>
        <button onClick={() => setSection('addUser')} className="btn">Add User</button>
        <button onClick={() => setSection('assignGuardian')} className="btn">Assign Guardian & Student</button>
        {showImage && (
        <img
          src="/adminDashboard.png"
          alt="Admin Dashboard"
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


      {section === 'users' && (
        <div>
          <h3>All Users</h3>
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.role}</td>
                  <td>

                    <button onClick={() => handleDelete(user.user_id, user.role)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {editUser && (
            <div className="edit-form">
              <h4>Edit {editUser.role}</h4>
              {Object.keys(editUser).map(
                (key) =>
                  !['id', 'role'].includes(key) && (
                    <div key={key}>
                      <label>{key}</label>
                      <input
                        type="text"
                        value={editUser[key] || ''}
                        onChange={(e) =>
                          setEditUser({ ...editUser, [key]: e.target.value })
                        }
                      />
                    </div>
                  )
              )}
              <button onClick={handleUpdate}>Update</button>
              <button onClick={() => setEditUser(null)}>Cancel</button>
            </div>
          )}
        </div>
      )}
      {section === 'addUser' && (
        <div className="add-user-section">
          <h3>Add New User</h3>
          <select onChange={(e) => setAddRole(e.target.value)} defaultValue="">
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="guardian">Guardian</option>
          </select>

          {addRole && (
            <div className="add-user-form">
              {/* STUDENT FORM */}
              {addRole === 'student' && (
                <>
                  <input type="text" placeholder="Student ID" onChange={(e) => setAddData({ ...addData, id: e.target.value })} />
                  <input type="text" placeholder="Name" onChange={(e) => setAddData({ ...addData, name: e.target.value })} />
                  <input type="date" placeholder="DOB" onChange={(e) => setAddData({ ...addData, date_of_birth: e.target.value })} />
                  <input type="text" placeholder="Contact No" onChange={(e) => setAddData({ ...addData, contact_no: e.target.value })} />
                  <input type="text" placeholder="Class Name" onChange={(e) => setAddData({ ...addData, class_name: e.target.value })} />
                  <input type="password" placeholder="Password" onChange={(e) => setAddData({ ...addData, password: e.target.value })} />
                </>
              )}

              {/* TEACHER FORM */}
              {addRole === 'teacher' && (
                <>
                  <input type="text" placeholder="Teacher ID" onChange={(e) => setAddData({ ...addData, teacher_id: e.target.value })} />
                  <input type="text" placeholder="Name" onChange={(e) => setAddData({ ...addData, name: e.target.value })} />
                  <input type="email" placeholder="Email" onChange={(e) => setAddData({ ...addData, email: e.target.value })} />
                  <input type="text" placeholder="Contact No" onChange={(e) => setAddData({ ...addData, contact_no: e.target.value })} />
                  <input type="date" placeholder="DOB" onChange={(e) => setAddData({ ...addData, date_of_birth: e.target.value })} />
                  <input type="text" placeholder="Subject ID" onChange={(e) => setAddData({ ...addData, subject_id: e.target.value })} />
                  <input type="password" placeholder="Password" onChange={(e) => setAddData({ ...addData, password: e.target.value })} />
                </>
              )}

              {/* GUARDIAN FORM */}
              {addRole === 'guardian' && (
                <>
                  <input type="text" placeholder="Guardian ID" onChange={(e) => setAddData({ ...addData, id: e.target.value })} />
                  <input type="text" placeholder="Name" onChange={(e) => setAddData({ ...addData, name: e.target.value })} />
                  <input type="email" placeholder="Email" onChange={(e) => setAddData({ ...addData, email: e.target.value })} />
                  <input type="text" placeholder="Contact No" onChange={(e) => setAddData({ ...addData, contact_no: e.target.value })} />
                  <input type="password" placeholder="Password" onChange={(e) => setAddData({ ...addData, password: e.target.value })} />
                </>
              )}

              <button onClick={handleAddUser}>Submit</button>
            </div>
          )}

        </div>
      )}

      {section === 'assign' && (
        <div className="assignment-section">
          <h3>Assign Class and Subject to Teacher</h3>

          <div className="dropdowns">
            <label>Teacher:</label>
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
              <option value="">-- Select --</option>
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.name}
                </option>
              ))}
            </select>

            <label>Class:</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">-- Select --</option>
              {classes.map((c) => (
                <option key={c.room_id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <label>Subject:</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">-- Select --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleAssign}>Assign</button>

          <h4>Existing Assignments</h4>
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Class</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.teacher_name}</td>
                  <td>{a.class_name}</td>
                  <td>{a.subject_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      )}
      {section === 'assignGuardian' && (
        <div className="assignment-section">
          <h3>Assign Guardian to Student</h3>

          <div className="dropdowns">
            <label>Guardian:</label>
            <select value={selectedGuardian} onChange={(e) => setSelectedGuardian(e.target.value)}>
              <option value="">-- Select Guardian --</option>
              {guardians.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <label>Student:</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label>Relationship:</label>
            <select value={guardianRole} onChange={(e) => setGuardianRole(e.target.value)}>
              <option value="">-- Select Role --</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
              <option value="Other">Other</option>
            </select>

          </div>
          <button onClick={handleAssignGuardian}>Assign</button>

          <h4>Existing Guardian-Student Assignments</h4>
          <table>
            <thead>
              <tr>
                <th>Guardian</th>
                <th>Student</th>
              </tr>
            </thead>
            <tbody>
              {guardianAssignments.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.guardian_name}</td>
                  <td>{a.student_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>

  );
}

export default AdminDashboard;
