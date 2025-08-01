require('dotenv').config();
const express = require('express');
const cors = require("cors");
const { query } = require('./db');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/login', async (req, res) => {
  const { user_id, password, role } = req.body;
  console.log('Login attempt:', user_id, password, role);

  try {
    const result = await query(
      `SELECT * FROM user_account 
   WHERE user_id::text = $1 
     AND password = $2 
     AND LOWER(role) = LOWER($3)`,
      [user_id.trim(), password.trim(), role.trim()]
    );

    if (result.rows.length === 1) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/student', async (req, res) => {
  try {
    const result = await query('SELECT * FROM "student"');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


// Get student info
app.get('/student/:id/info', async (req, res) => {
  const result = await query(`
    SELECT * FROM student WHERE id = $1
  `, [req.params.id]);
  res.json(result.rows);
});
app.put('/student/:id/update', async (req, res) => {
  try {
    const fields = req.body; // Object with key-value pairs
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'No data to update' });
    }

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const queryText = `UPDATE student SET ${setClause} WHERE id = $${keys.length + 1}`;

    await query(queryText, [...values, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});


// Get class & subjects
app.get('/student/:id/subjects', async (req, res) => {
  const result = await query(`
    SELECT s.name AS subject_name
    FROM student st
    JOIN class c ON st.class_name = c.name
    JOIN subject_class cs ON c.name = cs.class_name
    JOIN subject s ON cs.subject_id = s.id
    WHERE st.id = $1
  `, [req.params.id]);
  res.json(result.rows);
});

// Get GPA & results
app.get('/student/:id/gpa', async (req, res) => {
  const result = await query(`
    SELECT rt.result_id,s.name AS subject_name,rt.subject_gpa 
    FROM result_type rt JOIN result r 
    ON rt.result_id=r.result_id 
    JOIN subject s 
    ON rt.subject_id=s.id 
    WHERE r.student_id=(SELECT st.id FROM student st WHERE st.id=$1);
  `, [req.params.id]);
  res.json(result.rows);
});

// Get Guardians
app.get('/student/:id/guardians', async (req, res) => {
  const result = await query(`
    SELECT g.name, g.contact_no, g.email, sg.relation
    FROM student_guardian sg
    JOIN guardian g ON sg.guardian_id = g.id
    WHERE sg.student_id = (
      SELECT id FROM student WHERE id = $1
    )
  `, [req.params.id]);
  res.json(result.rows);
});


// Get assigned classes for teacher
app.get('/teacher/:id/classes', async (req, res) => {
  const teacherId = req.params.id;
  try {
    const result = await query(`
      SELECT ct.class_id
      FROM teacher_class ct
      WHERE ct.teacher_id=$1
    `, [teacherId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teacher classes:', err);
    res.status(500).json({ error: 'Failed to fetch teacher classes' });
  }
});

// Get subjects taught by the teacher
app.get('/teacher/:id/info', async (req, res) => {
  const teacherId = req.params.id;
  try {
    const result = await query(`
      SELECT * FROM teacher WHERE teacher_id = $1
    `, [teacherId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});
// Update teacher info
app.put('/teacher/:id/update', async (req, res) => {
  const teacherId = req.params.id;
  const updateData = req.body;

  const fields = Object.keys(updateData);
  const values = Object.values(updateData);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No update fields provided' });
  }

  const setClause = fields.map((field, i) => `"${field}" = $${i + 1}`).join(', ');

  try {
    await query(
      `UPDATE teacher SET ${setClause} WHERE teacher_id = $${fields.length + 1}`,
      [...values, teacherId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating teacher info:', err);
    res.status(500).json({ error: 'Failed to update teacher info' });
  }
});


// Placeholder: Students GPA submission (implement POST for real case)
app.get('/teacher/:id/enter-gpa', async (req, res) => {
  const teacherId = req.params.id;
  try {
    const result = await query(`
      SELECT st.id,rt.result_id,s.id AS subject_id,s.name,rt.subject_gpa
      FROM teacher t JOIN result_type rt
      ON(t.subject_id=rt.subject_id)
      JOIN subject s
      ON(rt.subject_id=s.id) 
      JOIN result r 
      ON(r.result_id=rt.result_id) 
      JOIN student st 
      ON(st.id=r.student_id) 
      WHERE t.teacher_id=$1;
    `, [teacherId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching GPA:', err);
    res.status(500).json({ error: 'Failed to fetch GPA data' });
  }
});

// Get GPA info for a specific class taught by the teacher
app.get('/teacher/:id/enter-gpa/:className', async (req, res) => {
  const teacherId = req.params.id;
  const className = req.params.className;

  try {
    const result = await query(`
      SELECT st.id, st.name AS student_name, s.id AS subject_id, s.name AS subject_name,
             rt.subject_gpa, rt.result_id
      FROM teacher t
      JOIN subject s ON t.subject_id = s.id
      JOIN class c ON c.name = $2
      JOIN student st ON st.class_name = c.name
      JOIN result r ON r.student_id = st.id
      JOIN result_type rt ON rt.result_id = r.result_id AND rt.subject_id = s.id
      WHERE t.teacher_id = $1
    `, [teacherId, className]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching GPA by class:', err);
    res.status(500).json({ error: 'Failed to fetch GPA data for selected class' });
  }
});

// Update student GPA (teacher input)
app.put('/teacher/:id/update-gpa', async (req, res) => {
  const teacherId = req.params.id;
  const { result_id, subject_gpa, subject_id } = req.body;

  if (!result_id || subject_gpa === undefined) {
    return res.status(400).json({ error: 'Missing result_id or subject_gpa' });
  }

  try {
    // Optionally: you can validate if this teacher has permission for this result_id.
    await query(
      `UPDATE result_type SET subject_gpa = $1 WHERE result_id = $2 AND subject_id=$3`,
      [subject_gpa, result_id, subject_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating GPA:', err);
    res.status(500).json({ error: 'Failed to update GPA' });
  }
  // trigger function and trigger
  /*CREATE OR REPLACE FUNCTION update_average_gpa()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE result
  SET gpa = (
    SELECT ROUND(AVG(subject_gpa), 2)
    FROM result_type
    WHERE result_id = NEW.result_id
  )
  WHERE result_id = NEW.result_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_update_gpa
AFTER INSERT OR UPDATE ON result_type
FOR EACH ROW
EXECUTE FUNCTION update_average_gpa();
*/
});

// Get children info

app.get('/guardian/:id/info', async (req, res) => {
  const teacherId = req.params.id;
  try {
    const result = await query(`
      SELECT * FROM guardian WHERE id = $1
    `, [teacherId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});
app.put('/guardian/:id/update', async (req, res) => {
  try {
    const fields = req.body; // Object with key-value pairs
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'No data to update' });
    }

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const queryText = `UPDATE guardian SET ${setClause} WHERE id = $${keys.length + 1}`;

    await query(queryText, [...values, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});
// Get results for a specific child
app.get('/guardian/:id/results/:childId', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.name AS subject_name, rt.subject_gpa 
      FROM result_type rt 
      JOIN result r ON rt.result_id = r.result_id 
      JOIN subject s ON rt.subject_id = s.id 
      WHERE r.student_id = $1
    `, [req.params.childId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching results for child:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

app.get('/guardian/:id/children', async (req, res) => {
  const guardianId = req.params.id;
  try {
    const result = await query(`
      SELECT s.id, s.name AS student_name, s.class_name
      FROM student_guardian gs
      JOIN student s ON gs.student_id = s.id
      WHERE gs.guardian_id = $1
    `, [guardianId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching children info:', err);
    res.status(500).json({ error: 'Failed to fetch children info' });
  }
});

// Get children's results
app.get('/guardian/:id/results', async (req, res) => {
  const guardianId = req.params.id;
  try {
    const result = await query(`
      SELECT rt.result_id,s.name AS subject_name,rt.subject_gpa 
      FROM result_type rt JOIN result r 
      ON rt.result_id=r.result_id 
      JOIN subject s 
      ON rt.subject_id=s.id 
      WHERE r.student_id IN (SELECT sg.student_id FROM student_guardian sg WHERE sg.guardian_id=$1);
    `, [guardianId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching children results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});


// Get all users
app.get('/admin/users', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM user_account`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all teachers
app.get('/admin/teachers', async (req, res) => {
  try {
    const result = await query(`SELECT teacher_id, name, email, contact_no, date_of_birth, subject_id FROM teacher`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get all classes
app.get('/admin/classes', async (req, res) => {
  try {
    const result = await query(`SELECT name, room_id FROM class`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get all subjects
app.get('/admin/subjects', async (req, res) => {
  try {
    const result = await query(`SELECT id, name FROM subject`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get all students
app.get('/admin/students', async (req, res) => {
  try {
    const result = await query(`SELECT id, name, date_of_birth, contact_no, class_name FROM student`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get all guardians
app.get('/admin/guardians', async (req, res) => {
  try {
    const result = await query(`SELECT id, name, contact_no, email FROM guardian`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching guardians:', err);
    res.status(500).json({ error: 'Failed to fetch guardians' });
  }
});

// POST ROUTES - Add new users

// Add new student
app.post('/admin/add-student', async (req, res) => {
  const { id, name, date_of_birth, contact_no, class_name, password } = req.body;

  try {
    await query(
      `INSERT INTO student (id, name, date_of_birth, contact_no, class_name) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, date_of_birth || null, contact_no || null, class_name || null]
    );

    await query(
      'INSERT INTO user_account (user_id, password, role) VALUES ($1, $2, $3)',
      [id, password || 'default123', 'student']
    );
    res.json({ success: true, message: 'Student added successfully', student_id: id });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Add new teacher
app.post('/admin/add-teacher', async (req, res) => {
  const { teacher_id, name, email, contact_no, date_of_birth, subject_id, password } = req.body;

  try {
    await query(
      `INSERT INTO teacher (teacher_id, name, email, contact_no, date_of_birth, subject_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [teacher_id, name, email || null, contact_no || null, date_of_birth || null, subject_id || null]
    );

    await query(
      'INSERT INTO user_account (user_id, password, role) VALUES ($1, $2, $3)',
      [teacher_id, password || 'default123', 'teacher']
    );

    res.json({ success: true, message: 'Teacher added successfully', teacher_id });
  } catch (err) {
    console.error('Error adding teacher:', err);
    res.status(500).json({ error: 'Failed to add teacher' });
  }
});

// Add new guardian
app.post('/admin/add-guardian', async (req, res) => {
  const { id, name, email, contact_no, password } = req.body;

  try {
    await query(
      `INSERT INTO guardian (id, name, email, contact_no) 
       VALUES ($1, $2, $3, $4)`,
      [id, name, email || null, contact_no || null]
    );

    await query(
      'INSERT INTO user_account (user_id, password, role) VALUES ($1, $2, $3)',
      [id, password || 'default123', 'guardian']
    );

    res.json({ success: true, message: 'Guardian added successfully', guardian_id: id });
  } catch (err) {
    console.error('Error adding guardian:', err);
    res.status(500).json({ error: 'Failed to add guardian' });
  }
});

// DELETE ROUTES - Remove users

app.delete('/admin/delete-user/:id', async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  try {
    // Delete from specific role table first (due to foreign key constraints)
    if (role === 'Student') {
      // Delete from student_guardian first if exists
      await query('DELETE FROM student_guardian WHERE student_id = $1', [userId]);
      // Delete from result table if exists
      await query('DELETE FROM result WHERE student_id = $1', [userId]);
      // Delete from student table
      await query('DELETE FROM student WHERE id = $1', [userId]);
    } else if (role === 'Teacher') {
      // Delete from teacher_class first
      await query('DELETE FROM teacher_class WHERE teacher_id = $1', [userId]);
      // Delete from teacher table
      await query('DELETE FROM teacher WHERE teacher_id = $1', [userId]);
    } else if (role === 'Guardian') {
      // Delete from student_guardian first
      await query('DELETE FROM student_guardian WHERE guardian_id = $1', [userId]);
      // Delete from guardian table
      await query('DELETE FROM guardian WHERE id = $1', [userId]);
    } else if (role === 'Admin') {
      await query('DELETE FROM admin WHERE id = $1', [userId]);
    }

    // Delete from user_account table
    await query('DELETE FROM user_account WHERE user_id = $1', [userId]);

    res.json({ success: true, message: `${role} deleted successfully` });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ASSIGNMENT ROUTES

// Assign teacher to class and subject
app.post('/admin/assign-teacher-class-subject', async (req, res) => {
  const { teacher_id, class_name, subject_id } = req.body;

  try {
    // Insert into teacher_class (associates teacher with class)
    await query(
      `INSERT INTO teacher_class (teacher_id, class_id) 
       VALUES ($1, $2) 
       ON CONFLICT (teacher_id, class_id) DO NOTHING`,
      [teacher_id, class_name]
    );

    // Insert into subject_class (associates subject with class)
    await query(
      `INSERT INTO subject_class (subject_id, class_name) 
       VALUES ($1, $2) 
       ON CONFLICT (subject_id, class_name) DO NOTHING`,
      [subject_id, class_name]
    );

    res.json({ success: true, message: 'Assignment completed successfully' });
  } catch (err) {
    console.error('Error assigning teacher/class/subject:', err);
    res.status(500).json({ error: 'Assignment failed' });
  }
});

// Get all assignments
app.get('/admin/assignments', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT
        t.name AS teacher_name,
        tc.class_id AS class_name,
        s.name AS subject_name
      FROM teacher_class tc
      JOIN teacher t ON tc.teacher_id = t.teacher_id
      JOIN subject_class sc ON tc.class_id = sc.class_name
      JOIN subject s ON sc.subject_id = s.id
      WHERE t.subject_id = s.id
      ORDER BY t.name, tc.class_id, s.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// ADDITIONAL UTILITY ROUTES

// Get detailed user information
app.get('/admin/user-details/:role/:id', async (req, res) => {
  const { role, id } = req.params;

  try {
    let result;

    if (role === 'student') {
      result = await query(`
        SELECT s.*, c.name as class_name, c.room_id
        FROM student s
        LEFT JOIN class c ON s.class_name = c.name
        WHERE s.id = $1
      `, [id]);
    } else if (role === 'teacher') {
      result = await query(`
        SELECT t.*, s.name as subject_name
        FROM teacher t
        LEFT JOIN subject s ON t.subject_id = s.id
        WHERE t.teacher_id = $1
      `, [id]);
    } else if (role === 'guardian') {
      result = await query(`
        SELECT g.*, 
               array_agg(st.name) as students
        FROM guardian g
        LEFT JOIN student_guardian sg ON g.id = sg.guardian_id
        LEFT JOIN student st ON sg.student_id = st.id
        WHERE g.id = $1
        GROUP BY g.id, g.name, g.email, g.contact_no
      `, [id]);
    }

    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user information
app.put('/admin/update-user/:role/:id', async (req, res) => {
  const { role, id } = req.params;
  const updateData = req.body;

  try {
    let query_text;
    let values;

    if (role === 'student') {
      query_text = `
        UPDATE student 
        SET name = $1, date_of_birth = $2, contact_no = $3, class_name = $4
        WHERE id = $5
      `;
      values = [updateData.name, updateData.date_of_birth, updateData.contact_no, updateData.class_name, id];
    } else if (role === 'teacher') {
      query_text = `
        UPDATE teacher 
        SET name = $1, email = $2, contact_no = $3, date_of_birth = $4, subject_id = $5
        WHERE teacher_id = $6
      `;
      values = [updateData.name, updateData.email, updateData.contact_no, updateData.date_of_birth, updateData.subject_id, id];
    } else if (role === 'guardian') {
      query_text = `
        UPDATE guardian 
        SET name = $1, email = $2, contact_no = $3
        WHERE id = $4
      `;
      values = [updateData.name, updateData.email, updateData.contact_no, id];
    }

    await query(query_text, values);
    res.json({ success: true, message: `${role} updated successfully` });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});
// Get all guardians
app.get('/admin/guardians', async (req, res) => {
  try {
    const result = await query('SELECT id, name FROM guardian');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching guardians:', err);
    res.status(500).json({ error: 'Failed to fetch guardians' });
  }
});

// Get all students
app.get('/admin/students', async (req, res) => {
  try {
    const result = await query('SELECT id, name FROM student');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Assign guardian to student
app.post('/admin/assign-guardian', async (req, res) => {
  const { guardian_id, student_id, role } = req.body;

  try {
    await query(
      `INSERT INTO student_guardian (guardian_id, student_id, relation)
       VALUES ($1, $2, $3)`,
      [guardian_id, student_id, role]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error assigning guardian:', err);
    res.status(500).json({ success: false, error: 'Failed to assign guardian' });
  }
});

// Get guardian-student assignments
app.get('/admin/guardian-assignments', async (req, res) => {
  try {
    const result = await query(`
      SELECT g.name AS guardian_name, s.name AS student_name
      FROM student_guardian gs
      JOIN guardian g ON gs.guardian_id = g.id
      JOIN student s ON gs.student_id = s.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get dashboard statistics
app.get('/admin/dashboard-stats', async (req, res) => {
  try {
    const [students, teachers, guardians, classes, subjects] = await Promise.all([
      query('SELECT COUNT(*) FROM student'),
      query('SELECT COUNT(*) FROM teacher'),
      query('SELECT COUNT(*) FROM guardian'),
      query('SELECT COUNT(*) FROM class'),
      query('SELECT COUNT(*) FROM subject')
    ]);

    res.json({
      students: parseInt(students.rows[0].count),
      teachers: parseInt(teachers.rows[0].count),
      guardians: parseInt(guardians.rows[0].count),
      classes: parseInt(classes.rows[0].count),
      subjects: parseInt(subjects.rows[0].count)
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});