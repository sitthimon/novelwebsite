const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: ['http://localhost:3000', 'https://bluesitthimon-copy-c5ebfthsdtahapef.southeastasia-01.azurewebsites.net'], // หรือใช้ '*' ชั่วคราว
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // ถ้ามีการใช้ cookie หรือ token
};

app.use(cors(corsOptions));

// Debug middleware
app.use((req, res, next) => {
  console.log('📥 Incoming request:', req.method, req.url);
  console.log('📋 Headers:', req.headers);
  next();
});

const config = {
  user: 'sitthimon',
  password: 'Blue2977000+',
  server: 'bluedatabase2004-copy.database.windows.net',
  database: 'novel_database',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// ✅ สร้าง pool ตัวเดียว แล้วใช้ซ้ำ
let pool;

sql.connect(config)
  .then((p) => {
    pool = p;
    console.log('✅ Connected to SQL Server');

    // ตัวอย่างทดสอบ query - เปลี่ยนเป็น users ตัวเล็ก
    return pool.request().query('SELECT * FROM users');
  })
  .then(result => {
    console.log('📄 Result:', result.recordset);
  })
  .catch(err => {
    console.error('❌ SQL error', err);
  });

// 🔐 Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!pool) {
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query(`
        SELECT * 
        FROM users 
        WHERE username = @username AND password = @password
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: user
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/register', async (req, res) => {
  console.log('=== REGISTER API DEBUG ===');
  console.log('Request body:', req.body);

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { username, password, confirmPassword, conrimPassword } = req.body;
  const actualConfirmPassword = confirmPassword || conrimPassword;

  if (!pool) {
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  if (!username || !password || !actualConfirmPassword) {
    return res.status(400).json({ error: 'Username, password, and confirm password are required' });
  }

  if (password !== actualConfirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // ตรวจสอบ structure ของ users table
    console.log('Checking users table structure...');
    const tableInfo = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('users table structure:', tableInfo.recordset);

    // ตรวจสอบ CHECK constraint ของ role
    const constraintInfo = await pool.request().query(`
      SELECT CHECK_CLAUSE
      FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
      JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
        ON cc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
      WHERE ccu.TABLE_NAME = 'users' AND ccu.COLUMN_NAME = 'role'
    `);
    console.log('Role constraint:', constraintInfo.recordset);

    // ตรวจสอบว่า username ซ้ำหรือไม่
    const checkUser = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`SELECT username FROM users WHERE username = @username`);

    if (checkUser.recordset.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // ลอง 'reader' เป็น default role ก่อน
    console.log('Trying default role: reader');
    try {
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .input('password', sql.VarChar, password)
        .input('role', sql.VarChar, 'reader')
        .query(`
          INSERT INTO users (username, password, role, created_at)
          VALUES (@username, @password, @role, GETDATE())
        `);

      console.log('✅ User registered successfully with role: reader');
      return res.status(201).json({
        success: true,
        message: 'User registered successfully with role: reader'
      });
    } catch (readerErr) {
      console.log('❌ Role "reader" failed:', readerErr.message);

      // ถ้า 'reader' ไม่ได้ ลองค่าอื่น
      const possibleRoles = ['admin', 'user', 'member', 'customer', 'guest'];

      for (const roleValue of possibleRoles) {
        try {
          console.log(`Trying role: ${roleValue}`);
          const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .input('role', sql.VarChar, roleValue)
            .query(`
              INSERT INTO users (username, password, role, created_at)
              VALUES (@username, @password, @role, GETDATE())
            `);

          console.log(`✅ User registered successfully with role: ${roleValue}`);
          return res.status(201).json({
            success: true,
            message: `User registered successfully with role: ${roleValue}`
          });
        } catch (roleErr) {
          console.log(`❌ Role '${roleValue}' failed:`, roleErr.message);
          continue;
        }
      }
    }

    // ถ้าทุก role ไม่ได้ ลองไม่ใส่ role
    console.log('Trying without role...');
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query(`
        INSERT INTO users (username, password, created_at)
        VALUES (@username, @password, GETDATE())
      `);

    console.log('✅ User registered successfully without role');
    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    console.error('Error details:', err.message);
    console.error('Error code:', err.code);

    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// 📊 เพิ่มวิว Chapter
app.post('/api/novels/:novelId/chapters/:chapterId/view', async (req, res) => {
  const { novelId, chapterId } = req.params;
  console.log('Received novel ID:', novelId, 'chapter ID:', chapterId);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  try {
    // ก่อนอื่นดู structure ของ table
    const tableInfo = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Chapters'
    `);
    console.log('Chapters table columns:', tableInfo.recordset);

    // ตรวจสอบว่ามี record อยู่หรือไม่
    const checkRecord = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('chapterId', sql.Int, chapterId)
      .query(`
        SELECT chapter_order, novel_id, title, view_count 
        FROM chapters 
        WHERE chapter_order = @chapterId AND novel_id = @novelId
      `);

    console.log('Existing record:', checkRecord.recordset);

    if (checkRecord.recordset.length === 0) {
      console.log('❌ No record found, creating new chapter...');
      // สร้าง chapter ใหม่อัตโนมัติ
      try {
        await pool.request()
          .input('novelId', sql.Int, novelId)
          .input('chapterId', sql.Int, chapterId)
          .input('title', sql.VarChar, `Chapter ${chapterId}`)
          .query(`
            INSERT INTO chapters (chapter_order, novel_id, title, view_count, like_count)
            VALUES (@chapterId, @novelId, @title, 0, 0)
          `);
        console.log('✅ Chapter created successfully');
      } catch (insertErr) {
        console.error('Error creating chapter:', insertErr);
        return res.status(500).json({
          error: 'Failed to create chapter',
          details: insertErr.message
        });
      }
    }

    // ลองใช้ chapter_order แทน chapter_id และ view_count แทน views
    const result = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('chapterId', sql.Int, chapterId)
      .query(`
        UPDATE chapters
        SET view_count = ISNULL(view_count, 0) + 1
        WHERE chapter_order = @chapterId AND novel_id = @novelId;
        SELECT @@ROWCOUNT as rowsAffected;
      `);

    console.log('Query result:', result);
    console.log('Rows affected:', result.recordset[0]?.rowsAffected);

    res.status(200).json({
      message: 'View added',
      novelId: novelId,
      chapterId: chapterId,
      rowsAffected: result.recordset[0]?.rowsAffected || 0
    });
  } catch (err) {
    console.error('Error adding view - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// 💖 เพิ่มไลค์ Chapter (Toggle Like/Unlike) - แก้ไขให้เป็น per-user
app.post('/api/novels/:novelId/chapters/:chapterId/like', async (req, res) => {
  const { novelId, chapterId } = req.params;
  const { userId } = req.body; // เพิ่ม userId

  console.log('Received like request - novel ID:', novelId, 'chapter ID:', chapterId, 'user ID:', userId);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  if (!userId) {
    console.log('Missing required field - userId:', userId);
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // ตรวจสอบว่ามี table chapter_likes หรือไม่ ถ้าไม่มีก็สร้าง
    console.log('Checking chapter_likes table structure...');
    const tableInfo = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'chapter_likes'
    `);
    console.log('chapter_likes table columns:', tableInfo.recordset);

    // ถ้าไม่มี table chapter_likes ให้สร้าง
    if (tableInfo.recordset.length === 0) {
      console.log('Creating chapter_likes table...');
      await pool.request().query(`
        CREATE TABLE chapter_likes (
          id INT IDENTITY(1,1) PRIMARY KEY,
          novel_id INT NOT NULL,
          chapter_order INT NOT NULL,
          user_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          UNIQUE(novel_id, chapter_order, user_id)
        )
      `);
      console.log('✅ Chapter_likes table created successfully');
    }

    // ตรวจสอบว่ามี chapter อยู่หรือไม่ ถ้าไม่มีก็สร้าง
    const checkChapter = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('chapterId', sql.Int, chapterId)
      .query(`
        SELECT chapter_order, novel_id, title, like_count 
        FROM chapters 
        WHERE chapter_order = @chapterId AND novel_id = @novelId
      `);

    if (checkChapter.recordset.length === 0) {
      console.log('❌ No chapter found, creating new chapter...');
      await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .input('title', sql.VarChar, `Chapter ${chapterId}`)
        .query(`
          INSERT INTO chapters (chapter_order, novel_id, title, view_count, like_count)
          VALUES (@chapterId, @novelId, @title, 0, 0)
        `);
      console.log('✅ Chapter created successfully');
    }

    // ตรวจสอบว่า user เคยไลค์ chapter นี้แล้วหรือไม่
    const checkUserLike = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('chapterId', sql.Int, chapterId)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT novel_id, chapter_order, user_id
        FROM chapter_likes
        WHERE novel_id = @novelId AND chapter_order = @chapterId AND user_id = @userId
      `);

    console.log('Existing user like record:', checkUserLike.recordset);

    let result;
    let action;

    if (checkUserLike.recordset.length > 0) {
      // ลบ like ของ user (unlike)
      console.log('Removing user like...');

      // ลบ record ใน chapter_likes
      await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .input('userId', sql.Int, userId)
        .query(`
          DELETE FROM chapter_likes
          WHERE novel_id = @novelId AND chapter_order = @chapterId AND user_id = @userId
        `);

      // ลด like_count ใน chapters table
      result = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .query(`
          UPDATE chapters 
          SET like_count = CASE 
            WHEN like_count > 0 THEN like_count - 1 
            ELSE 0 
          END
          WHERE chapter_order = @chapterId AND novel_id = @novelId;
          
          SELECT like_count FROM chapters 
          WHERE chapter_order = @chapterId AND novel_id = @novelId;
        `);

      action = 'unliked';
      console.log('User unlike successful');
    } else {
      // เพิ่ม like ของ user
      console.log('Adding user like...');

      // เพิ่ม record ใน chapter_likes
      await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .input('userId', sql.Int, userId)
        .query(`
          INSERT INTO chapter_likes (novel_id, chapter_order, user_id, created_at)
          VALUES (@novelId, @chapterId, @userId, GETDATE())
        `);

      // เพิ่ม like_count ใน chapters table
      result = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .query(`
          UPDATE chapters 
          SET like_count = ISNULL(like_count, 0) + 1
          WHERE chapter_order = @chapterId AND novel_id = @novelId;
          
          SELECT like_count FROM chapters 
          WHERE chapter_order = @chapterId AND novel_id = @novelId;
        `);

      action = 'liked';
      console.log('User like successful');
    }

    console.log('Like query result:', result);

    const likeResult = result.recordset[0];
    const isLiked = action === 'liked';

    res.status(200).json({
      message: `Chapter ${action} by user`,
      novelId: novelId,
      chapterId: chapterId,
      userId: userId,
      likeCount: likeResult.like_count,
      isLiked: isLiked,
      action: action
    });
  } catch (err) {
    console.error('Error managing chapter like - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);

    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

app.post('/api/novels/:novelId/rating', async (req, res) => {
  const { novelId } = req.params;
  const { userId, rating } = req.body;

  console.log('=== RATING API DEBUG ===');
  console.log('Received rating request - novel ID:', novelId, 'user ID:', userId, 'rating:', rating);
  console.log('Request body:', req.body);
  console.log('Request params:', req.params);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  if (!userId || !rating) {
    console.log('Missing required fields - userId:', userId, 'rating:', rating);
    return res.status(400).json({ error: 'User ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    console.log('Invalid rating value:', rating);
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // ก่อนอื่นดู structure ของ table novels_rating
    console.log('Checking novels_rating table structure...');
    const tableInfo = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'novels_rating'
    `);
    console.log('novels_rating table columns:', tableInfo.recordset);

    // ตรวจสอบว่า user เคยให้ rating novel นี้แล้วหรือไม่
    console.log('Checking existing rating...');
    const checkRecord = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT id, novel_id, user_id, rating 
        FROM novels_rating
        WHERE novel_id = @novelId AND user_id = @userId 
      `);

    console.log('Existing rating record:', checkRecord.recordset);

    let result;
    if (checkRecord.recordset.length > 0) {
      // อัปเดต rating เดิม
      console.log('Updating existing rating...');
      result = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('userId', sql.Int, userId)
        .input('rating', sql.Int, rating)
        .query(`
          UPDATE novels_rating
          SET rating = @rating
          WHERE novel_id = @novelId AND user_id = @userId;
          SELECT @@ROWCOUNT as rowsAffected;
        `);
      console.log('Updated rating');
    } else {
      // สร้าง rating ใหม่
      console.log('Creating new rating...');
      result = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('userId', sql.Int, userId)
        .input('rating', sql.Int, rating)
        .query(`
          INSERT INTO novels_rating (novel_id, user_id, rating)
          VALUES (@novelId, @userId, @rating);
          SELECT @@ROWCOUNT as rowsAffected;
        `);
      console.log('Created new rating');
    }

    console.log('Rating query result:', result);
    console.log('Rating rows affected:', result.recordset[0]?.rowsAffected);

    res.status(200).json({
      message: checkRecord.recordset.length > 0 ? 'Rating updated' : 'Rating added',
      novelId: novelId,
      userId: userId,
      rating: rating,
      rowsAffected: result.recordset[0]?.rowsAffected || 0
    });
  } catch (err) {
    console.error('=== ERROR IN RATING API ===');
    console.error('Error adding rating - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Error number:', err.number);
    console.error('Error state:', err.state);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// ⭐ Rating ของ Chapter (แยกจาก Novel)
app.post('/api/novels/:novelId/chapters/:chapterId/rating', async (req, res) => {
  const { novelId, chapterId } = req.params;
  const { userId, rating } = req.body;

  console.log('=== CHAPTER RATING API DEBUG ===');
  console.log('Received chapter rating request - novel ID:', novelId, 'chapter ID:', chapterId, 'user ID:', userId, 'rating:', rating);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  if (!userId || !rating) {
    console.log('Missing required fields - userId:', userId, 'rating:', rating);
    return res.status(400).json({ error: 'User ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    console.log('Invalid rating value:', rating);
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // ตรวจสอบว่า user เคยให้ rating chapter นี้แล้วหรือไม่
    const checkRecord = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('chapterId', sql.Int, chapterId)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT id, novel_id, chapter_order, user_id, rating 
        FROM chapter_ratings
        WHERE novel_id = @novelId AND chapter_order = @chapterId AND user_id = @userId 
      `);

    console.log('Existing chapter rating record:', checkRecord.recordset);

    let result;
    if (checkRecord.recordset.length > 0) {
      // อัปเดต rating เดิม
      console.log('Updating existing chapter rating...');
      result = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .input('userId', sql.Int, userId)
        .input('rating', sql.Int, rating)
        .query(`
          UPDATE chapter_ratings
          SET rating = @rating
          WHERE novel_id = @novelId AND chapter_order = @chapterId AND user_id = @userId;
          SELECT @@ROWCOUNT as rowsAffected;
        `);
      console.log('Updated chapter rating');
    } else {
      // สร้าง rating ใหม่
      console.log('Creating new chapter rating...');
      result = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .input('userId', sql.Int, userId)
        .input('rating', sql.Int, rating)
        .query(`
          INSERT INTO chapter_ratings (novel_id, chapter_order, user_id, rating)
          VALUES (@novelId, @chapterId, @userId, @rating);
          SELECT @@ROWCOUNT as rowsAffected;
        `);
      console.log('Created new chapter rating');
    }

    res.status(200).json({
      message: checkRecord.recordset.length > 0 ? 'Chapter rating updated' : 'Chapter rating added',
      novelId: novelId,
      chapterId: chapterId,
      userId: userId,
      rating: rating,
      rowsAffected: result.recordset[0]?.rowsAffected || 0
    });
  } catch (err) {
    console.error('=== ERROR IN CHAPTER RATING API ===');
    console.error('Error adding chapter rating:', err);
    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// ⭐ ดึงข้อมูล rating ของ chapter
app.get('/api/novels/:novelId/chapters/:chapterId/rating', async (req, res) => {
  const { novelId, chapterId } = req.params;

  console.log('=== GET CHAPTER RATING API ===');
  console.log('Fetching chapter rating for novel ID:', novelId, 'chapter ID:', chapterId);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  try {
    // คำนวณ average rating และนับจำนวนคนที่โหวต
    const result = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('chapterId', sql.Int, chapterId)
      .query(`
        SELECT 
          COUNT(*) as total_votes,
          AVG(CAST(rating AS FLOAT)) as average_rating,
          MIN(rating) as min_rating,
          MAX(rating) as max_rating
        FROM chapter_ratings 
        WHERE novel_id = @novelId AND chapter_order = @chapterId
      `);

    console.log('Chapter rating statistics result:', result.recordset);

    const stats = result.recordset[0];

    res.status(200).json({
      novelId: novelId,
      chapterId: chapterId,
      totalVotes: stats.total_votes || 0,
      averageRating: stats.average_rating ? parseFloat(stats.average_rating.toFixed(2)) : 0,
      minRating: stats.min_rating || 0,
      maxRating: stats.max_rating || 0
    });
  } catch (err) {
    console.error('=== ERROR IN GET CHAPTER RATING API ===');
    console.error('Error fetching chapter rating:', err);
    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// 📊 ดึงข้อมูล like และ view count ของ chapter - แก้ไขให้รองรับ user-specific
app.get('/api/novels/:novelId/chapters/:chapterId/like', async (req, res) => {
  const { novelId, chapterId } = req.params;
  const { userId } = req.query; // เพิ่ม userId จาก query parameter

  console.log('=== GET LIKE API ===');
  console.log('Fetching like count for novel ID:', novelId, 'chapter ID:', chapterId, 'user ID:', userId);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  try {
    // ดึงข้อมูล like_count และ view_count ของ chapter
    const chapterResult = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('chapterId', sql.Int, chapterId)
      .query(`
        SELECT 
          chapter_order,
          novel_id,
          title,
          like_count,
          view_count
        FROM chapters 
        WHERE chapter_order = @chapterId AND novel_id = @novelId
      `);

    console.log('Chapter like result:', chapterResult.recordset);

    let isLikedByUser = false;

    // ตรวจสอบว่า user ไลค์ chapter นี้หรือไม่ (ถ้ามี userId)
    if (userId) {
      const userLikeResult = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('chapterId', sql.Int, chapterId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT COUNT(*) as isLiked
          FROM chapter_likes
          WHERE novel_id = @novelId AND chapter_order = @chapterId AND user_id = @userId
        `);

      isLikedByUser = userLikeResult.recordset[0].isLiked > 0;
      console.log('User like status:', isLikedByUser);
    }

    if (chapterResult.recordset.length === 0) {
      // Return default values instead of error
      console.log('No chapter found, returning default values');
      return res.status(200).json({
        novelId: novelId,
        chapterId: chapterId,
        title: `Chapter ${chapterId}`,
        likeCount: 0,
        viewCount: 0,
        isLikedByUser: false
      });
    }

    const chapter = chapterResult.recordset[0];

    res.status(200).json({
      novelId: novelId,
      chapterId: chapterId,
      title: chapter.title,
      likeCount: chapter.like_count || 0,
      viewCount: chapter.view_count || 0,
      isLikedByUser: isLikedByUser
    });
  } catch (err) {
    console.error('=== ERROR IN GET LIKE API ===');
    console.error('Error fetching like count - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// 📊 ดึงข้อมูล rating ของ novel (average และจำนวนคนโหวต)
app.get('/api/novels/:novelId/rating', async (req, res) => {
  const { novelId } = req.params;

  console.log('=== GET RATING API ===');
  console.log('Fetching rating for novel ID:', novelId);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  try {
    // คำนวณ average rating และนับจำนวนคนที่โหวต
    const result = await pool.request()
      .input('novelId', sql.Int, novelId)
      .query(`
        SELECT 
          COUNT(*) as total_votes,
          AVG(CAST(rating AS FLOAT)) as average_rating,
          MIN(rating) as min_rating,
          MAX(rating) as max_rating
        FROM novels_rating 
        WHERE novel_id = @novelId
      `);

    console.log('Rating statistics result:', result.recordset);

    const stats = result.recordset[0];

    res.status(200).json({
      novelId: novelId,
      totalVotes: stats.total_votes || 0,
      averageRating: stats.average_rating ? parseFloat(stats.average_rating.toFixed(2)) : 0,
      minRating: stats.min_rating || 0,
      maxRating: stats.max_rating || 0
    });
  } catch (err) {
    console.error('=== ERROR IN GET RATING API ===');
    console.error('Error fetching rating - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// ⭐ POST Favorites - เพิ่ม/ลบ นิยายจากรายการโปรด (Toggle)
app.post('/api/novels/:novelId/favorites', async (req, res) => {
  const { novelId } = req.params;
  const { userId } = req.body;

  console.log('=== FAVORITES API DEBUG ===');
  console.log('Received favorites request - novel ID:', novelId, 'user ID:', userId);
  console.log('Request body:', req.body);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  if (!userId) {
    console.log('Missing required field - userId:', userId);
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // ตรวจสอบว่ามี table favorites หรือไม่ ถ้าไม่มีก็สร้าง
    console.log('Checking favorites table structure...');
    const tableInfo = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'favorites'
    `);
    console.log('favorites table columns:', tableInfo.recordset);

    // ถ้าไม่มี table favorites ให้สร้าง
    if (tableInfo.recordset.length === 0) {
      console.log('Creating favorites table...');
      await pool.request().query(`
        CREATE TABLE favorites (
          id INT IDENTITY(1,1) PRIMARY KEY,
          novel_id INT NOT NULL,
          user_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          UNIQUE(novel_id, user_id)
        )
      `);
      console.log('✅ Favorites table created successfully');
    }

    // ตรวจสอบว่า user เคยเพิ่ม novel นี้ใน favorites แล้วหรือไม่
    console.log('Checking existing favorite...');
    const checkRecord = await pool.request()
      .input('novelId', sql.Int, novelId)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT novel_id, user_id
        FROM favorites
        WHERE novel_id = @novelId AND user_id = @userId 
      `);

    console.log('Existing favorite record:', checkRecord.recordset);

    let result;
    let action;

    if (checkRecord.recordset.length > 0) {
      // ลบออกจาก favorites (unlike)
      console.log('Removing from favorites...');
      result = await pool.request()
        .input('novelId', sql.Int, novelId)
        .input('userId', sql.Int, userId)
        .query(`
          DELETE FROM favorites
          WHERE novel_id = @novelId AND user_id = @userId;
          SELECT @@ROWCOUNT as rowsAffected;
        `);
      action = 'removed';
      console.log('Removed from favorites');
    } else {
      // เพิ่มใน favorites - ไม่ใส่ created_at ถ้าไม่มี column นี้
      console.log('Adding to favorites...');

      // ตรวจสอบว่ามี column created_at หรือไม่
      const hasCreatedAt = tableInfo.recordset.some(col => col.COLUMN_NAME === 'created_at');

      if (hasCreatedAt) {
        result = await pool.request()
          .input('novelId', sql.Int, novelId)
          .input('userId', sql.Int, userId)
          .query(`
            INSERT INTO favorites (novel_id, user_id, created_at)
            VALUES (@novelId, @userId, GETDATE());
            SELECT @@ROWCOUNT as rowsAffected;
          `);
      } else {
        result = await pool.request()
          .input('novelId', sql.Int, novelId)
          .input('userId', sql.Int, userId)
          .query(`
            INSERT INTO favorites (novel_id, user_id)
            VALUES (@novelId, @userId);
            SELECT @@ROWCOUNT as rowsAffected;
          `);
      }

      action = 'added';
      console.log('Added to favorites');
    }

    console.log('Favorites query result:', result);
    console.log('Favorites rows affected:', result.recordset[0]?.rowsAffected);

    res.status(200).json({
      message: action === 'added' ? 'Added to favorites' : 'Removed from favorites',
      novelId: novelId,
      userId: userId,
      action: action,
      isFavorited: action === 'added',
      rowsAffected: result.recordset[0]?.rowsAffected || 0
    });
  } catch (err) {
    console.error('=== ERROR IN FAVORITES API ===');
    console.error('Error managing favorites - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);

    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

// 📚 GET Favorites - ดึงรายการนิยายโปรดของ user
app.get('/api/users/:userId/favorites', async (req, res) => {
  const { userId } = req.params;

  console.log('=== GET FAVORITES API ===');
  console.log('Fetching favorites for user ID:', userId);

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  try {
    // ก่อนอื่นตรวจสอบ structure ของ table favorites
    console.log('Checking favorites table structure...');
    const tableInfo = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'favorites'
    `);
    console.log('favorites table columns:', tableInfo.recordset);

    // ตรวจสอบว่ามี column created_at หรือไม่
    const hasCreatedAt = tableInfo.recordset.some(col => col.COLUMN_NAME === 'created_at');

    // ดึงรายการ favorites โดยเลือกเฉพาะ column ที่มีอยู่
    let query = `
      SELECT 
        novel_id,
        user_id
    `;

    if (hasCreatedAt) {
      query += `, created_at`;
    }

    query += `
      FROM favorites
      WHERE user_id = @userId
    `;

    if (hasCreatedAt) {
      query += ` ORDER BY created_at DESC`;
    }

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(query);

    console.log('Favorites result:', result.recordset);

    res.status(200).json({
      userId: userId,
      totalFavorites: result.recordset.length,
      favorites: result.recordset
    });
  } catch (err) {
    console.error('=== ERROR IN GET FAVORITES API ===');
    console.error('Error fetching favorites - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);

    if (err.message.includes("Invalid object name 'favorites'")) {
      return res.status(200).json({
        userId: userId,
        totalFavorites: 0,
        favorites: [],
        message: 'No favorites table found. Add some favorites first.'
      });
    }

    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

app.get('/api/novels/stat', async (req, res) => {
  console.log('=== NOVELS STAT API ===');

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  try {
    // ใช้ pool.request() แทน db.query เพราะเป็น SQL Server
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM novels) AS total_novels,
        (SELECT SUM(ISNULL(view_count, 0)) FROM chapters) AS total_views,
        (SELECT SUM(ISNULL(like_count, 0)) FROM chapters) AS total_likes,
        (SELECT COUNT(*) FROM users) AS total_users
    `);

    console.log('Stat query result:', result.recordset);

    const stats = result.recordset[0];

    res.json({
      totalNovels: stats.total_novels || 0,
      totalViews: stats.total_views || 0,
      totalLikes: stats.total_likes || 0,
      totalUsers: stats.total_users || 0
    });
  } catch (err) {
    console.error('Error in /api/novels/stat:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);

    // ถ้าไม่มี table ใดๆ ให้ return default values
    if (err.message.includes("Invalid object name")) {
      console.log('Some tables not found, returning default values');
      return res.json({
        totalNovels: 0,
        totalViews: 0,
        totalLikes: 0,
        totalUsers: 0,
        message: 'Some database tables not found'
      });
    }

    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

app.get('/api/users', async (req, res) => {
  console.log('=== GET NOVELS BY USER API ===');

  if (!pool) {
    console.log('Database pool not connected');
    return res.status(503).json({ error: 'Database not connected yet' });
  }

  try {
    const userId = req.query.userId;

    // ตรวจสอบว่า userId ถูกส่งมาหรือไม่
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // ดึงนิยายที่ผู้ใช้คนนี้เขียน
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT * FROM users WHERE 
      `);

    console.log('Novels by user result:', result.recordset);

    res.status(200).json({
      userId: userId,
      totalNovels: result.recordset.length,
      novels: result.recordset
    });
  } catch (err) {
    console.error('=== ERROR IN GET NOVELS BY USER API ===');
    console.error('Error fetching novels by user - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);

    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
});

app.get('/api/novels/like-view-summary', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }
    const result = await pool.request()
      .query(`
        SELECT novel_id,
          SUM(ISNULL(like_count,0)) AS total_likes,
          SUM(ISNULL(view_count,0)) AS total_views
        FROM chapters
        GROUP BY novel_id
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('SQL query error:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
});

app.get('/api/getusers', async (req, res) => {
  console.log('📥 Incoming request: GET /api/getusers');
  try {
    const pool = await sql.connect(config);
    const result = await pool.query(`
      SELECT user_id, username, role, created_at
      FROM users
      ORDER BY user_id
    `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
// เพิ่ม API endpoint นี้ใน server ของคุณ

app.post('/api/admin/novels', async (req, res) => {
  const { title, description, cover_image_url, author_name } = req.body;

  try {
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('cover_image_url', sql.NVarChar, cover_image_url)
      .input('author_name', sql.NVarChar, author_name)
      .query(`
        INSERT INTO novels (title, description, cover_image_url, author_name)
        VALUES (@title, @description, @cover_image_url, @author_name)
      `);

    res.status(201).json({ message: 'เพิ่มนิยายเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการเพิ่มนิยาย',
      details: error.message
    });
  }
});

//API CALL NOVELS AND CHPATERS

// เพิ่ม API endpoints เหล่านี้ใน server ของคุณ

// 1. API สำหรับดึงนิยายทั้งหมด
app.get('/api/novels', async (req, res) => {
  console.log('📥 Incoming request: GET /api/novels');

  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }

    const result = await pool.request().query(`
      SELECT 
        novel_id,
        title,
        description,
        cover_image_url,
        author_name
      FROM novels
    `);

    console.log(`✅ Found ${result.recordset.length} novels`);

    // แปลงข้อมูลให้ตรงกับ format ที่ frontend ต้องการ
    const novels = result.recordset.map(novel => ({
      id: novel.novel_id.toString(),
      title: novel.title,
      author: novel.author_name,
      description: novel.description,
      coverUrl: novel.cover_image_url,
      createdAt: novel.created_at
    }));

    res.json(novels);

  } catch (error) {
    console.error('❌ Error fetching novels:', error);
    res.status(500).json({
      error: 'Failed to fetch novels',
      details: error.message
    });
  }
});

// 2. API สำหรับดึงนิยายพร้อมตอน (chapters)
app.get('/api/novels-with-chapters', async (req, res) => {
  console.log('📥 Incoming request: GET /api/novels-with-chapters');

  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }

    // ดึงข้อมูลนิยายทั้งหมด
    const novelsResult = await pool.request().query(`
       SELECT 
       novel_id,
       title,
       description,
       cover_image_url,
       author_name
       FROM novels
    `);

    // ดึงข้อมูลตอนทั้งหมด
    const chaptersResult = await pool.request().query(`
          SELECT 
      chapter_id,
      novel_id,
      chapter_order,
      title,
      txt_file_url,
      audio_file_url
    FROM chapters
    ORDER BY novel_id, chapter_order

    `);

    // จัดกลุ่มตอนตาม novel_id
    const chaptersByNovel = {};
    chaptersResult.recordset.forEach(chapter => {
      if (!chaptersByNovel[chapter.novel_id]) {
        chaptersByNovel[chapter.novel_id] = [];
      }
      chaptersByNovel[chapter.novel_id].push({
        id: chapter.chapter_order,
        title: chapter.title,
        url: chapter.text_file_url,
        audioUrl: chapter.audio_file_url,
        createdAt: chapter.created_at
      });
    });

    // รวมข้อมูลนิยายกับตอน
    const novelsWithChapters = novelsResult.recordset.map(novel => ({
      id: novel.novel_id.toString(),
      title: novel.title,
      author: novel.author_name,
      description: novel.description,
      coverUrl: novel.cover_image_url,
      createdAt: novel.created_at,
      chapters: chaptersByNovel[novel.novel_id] || []
    }));

    console.log(`✅ Found ${novelsWithChapters.length} novels with chapters`);
    res.json(novelsWithChapters);

  } catch (error) {
    console.error('❌ Error fetching novels with chapters:', error);
    res.status(500).json({
      error: 'Failed to fetch novels with chapters',
      details: error.message
    });
  }
});

// 3. API สำหรับดึงนิยายเดี่ยว (by ID)
app.get('/api/novels/:id', async (req, res) => {
  console.log('📥 Incoming request: GET /api/novels/:id');

  try {
    const novelId = req.params.id;

    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }

    // ดึงข้อมูลนิยาย
    const novelResult = await pool.request()
      .input('novelId', sql.Int, novelId)
      .query(`
        SELECT 
          novel_id,
          title,
          description,
          cover_image_url,
          author_name
        FROM novels
        WHERE novel_id = @novelId
      `);

    if (novelResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Novel not found' });
    }

    // ดึงข้อมูลตอน
    const chaptersResult = await pool.request()
      .input('novelId', sql.Int, novelId)
      .query(`
        SELECT 
          chapter_id,
          chapter_order,
          title,
          txt_file_url,
          audio_file_url
        FROM chapters
        WHERE novel_id = @novelId
        ORDER BY chapter_order
      `);

    const novel = novelResult.recordset[0];
    const chapters = chaptersResult.recordset.map(chapter => ({
      id: chapter.chapter_order,
      title: chapter.title,
      url: chapter.txt_file_url,   // ✅ ใช้ชื่อที่ตรงกับ database
      audioUrl: chapter.audio_file_url,
      createdAt: chapter.created_at
    }));
    const response = {
      id: novel.novel_id.toString(),
      title: novel.title,
      author: novel.author_name,
      description: novel.description,
      coverUrl: novel.cover_image_url,
      createdAt: novel.created_at,
      chapters: chapters
    };

    console.log(`✅ Found novel: ${novel.title} with ${chapters.length} chapters`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching novel:', error);
    res.status(500).json({
      error: 'Failed to fetch novel',
      details: error.message
    });
  }
});

// 4. API สำหรับดึงตอนทั้งหมด
app.get('/api/chapters', async (req, res) => {
  console.log('📥 Incoming request: GET /api/chapters');

  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }

    const result = await pool.request().query(`
      SELECT 
        c.chapter_id,
        c.novel_id,
        c.chapter_order,
        c.title,
        c.text_file_url,
        c.audio_file_url,
        n.title as novel_title
      FROM chapters c
      INNER JOIN novels n ON c.novel_id = n.novel_id
      ORDER BY c.novel_id, c.chapter_order
    `);

    const chapters = result.recordset.map(chapter => ({
      id: chapter.chapter_id,
      novelId: chapter.novel_id,
      novelTitle: chapter.novel_title,
      order: chapter.chapter_order,
      title: chapter.title,
      url: chapter.text_file_url,
      audioUrl: chapter.audio_file_url,
      hasAudio: !!chapter.audio_file_url,
      createdAt: new Date(chapter.created_at).toLocaleDateString('th-TH')
    }));

    console.log(`✅ Found ${chapters.length} chapters`);
    res.json(chapters);

  } catch (error) {
    console.error('❌ Error fetching chapters:', error);
    res.status(500).json({
      error: 'Failed to fetch chapters',
      details: error.message
    });
  }
});

// 6. API สำหรับเพิ่มตอนใหม่
app.post('/api/admin/chapters', async (req, res) => {
  console.log('📥 Incoming request: POST /api/admin/chapters');
  console.log('Request body:', req.body);
  
  try {
    const { novel_id, title, txt_file_url, audio_file_url } = req.body;
    
    // Validation
    if (!novel_id || !title) {
      return res.status(400).json({ 
        error: 'กรุณาใส่ novel_id และชื่อตอน',
        details: 'novel_id and title are required' 
      });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({ 
        error: 'ชื่อตอนไม่สามารถเป็นค่าว่างได้' 
      });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }

    // หา chapter_order ล่าสุดของนิยายนี้
    const maxOrderResult = await pool.request()
      .input('novelId', sql.Int, novel_id)
      .query(`
        SELECT ISNULL(MAX(chapter_order), 0) as max_order
        FROM chapters
        WHERE novel_id = @novelId
      `);

    const nextOrder = maxOrderResult.recordset[0].max_order + 1;

    // Insert new chapter into database
    const result = await pool.request()
      .input('novel_id', sql.Int, novel_id)
      .input('chapter_order', sql.Int, nextOrder)
      .input('title', sql.NVarChar, title.trim())
      .input('txt_file_url', sql.NVarChar, txt_file_url ? txt_file_url.trim() : null)
      .input('audio_file_url', sql.NVarChar, audio_file_url ? audio_file_url.trim() : null)
      .query(`
        INSERT INTO chapters (novel_id, chapter_order, title, txt_file_url, audio_file_url)
        OUTPUT inserted.chapter_id, inserted.novel_id, inserted.chapter_order, inserted.title
        VALUES (@novel_id, @chapter_order, @title, @txt_file_url, @audio_file_url)
      `);

    const newChapter = result.recordset[0];
    
    console.log('✅ Chapter created successfully:', newChapter);
    
    res.status(201).json({
      success: true,
      message: 'เพิ่มตอนสำเร็จ',
      chapter: {
        id: newChapter.chapter_id,
        novel_id: newChapter.novel_id,
        chapter_order: newChapter.chapter_order,
        title: newChapter.title
      }
    });

  } catch (error) {
    console.error('❌ Error creating chapter:', error);
    
    // Handle specific SQL errors
    if (error.number === 547) { // Foreign key constraint violation
      return res.status(400).json({ 
        error: 'ไม่พบนิยายที่ระบุ' 
      });
    }
    
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการเพิ่มตอน',
      details: error.message 
    });
  }
});
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}
// 🎯 PATCH อัปเดตนิยาย
app.patch('/api/admin/novels/:novel_id', async (req, res) => {
  const { novel_id } = req.params;
  const { title, description, cover_image_url, author_name } = req.body;

  console.log('📥 Incoming request: PATCH /api/admin/novels/' + novel_id);
  console.log('📋 Body:', req.body);

  // ตรวจสอบว่า URL ถูกต้องหรือไม่ (ถ้ามีค่า)
  if (cover_image_url && !isValidUrl(cover_image_url)) {
    return res.status(400).json({ error: 'Invalid cover_image_url' });
  }

  try {
    const pool = await sql.connect(config);

    const result = await pool
      .request()
      .input('novel_id', sql.Int, novel_id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('cover_image_url', sql.NVarChar, cover_image_url)
      .input('author_name', sql.NVarChar, author_name)
      .query(`
        UPDATE novels
        SET 
          title = @title,
          description = @description,
          cover_image_url = @cover_image_url,
          author_name = @author_name
        WHERE novel_id = @novel_id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'ไม่พบนิยายที่จะแก้ไข' });
    }

    res.status(200).json({ message: 'อัปเดตนิยายสำเร็จ' });
  } catch (err) {
    console.error('❌ Error updating novel:', err.message);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการแก้ไขนิยาย',
      details: err.message,
    });
  }
});
// 🎯 PATCH แก้ไขข้อมูลผู้ใช้
app.patch('/api/admin/users/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { username, password, role } = req.body;

  console.log(`📥 PATCH /api/admin/users/${user_id}`);
  console.log('📋 Body:', req.body);

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'กรุณาระบุ username, password และ role' });
  }

  try {
    const pool = await sql.connect(config);

    const result = await pool
      .request()
      .input('user_id', sql.Int, user_id)
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .query(`
        UPDATE users
        SET 
          username = @username,
          password = @password,
          role = @role
        WHERE user_id = @user_id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'ไม่พบ user ที่ต้องการอัปเดต' });
    }

    res.status(200).json({ message: 'อัปเดต user สำเร็จ' });
  } catch (err) {
    console.error('❌ Error updating user:', err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้', details: err.message });
  }
});

// 🎯 PATCH อัปเดตตอน
app.patch('/api/admin/chapters/:chapter_order', async (req, res) => {
  const { chapter_order } = req.params;
  const { title, audio_file_url, txt_file_url } = req.body;

  console.log('📥 Incoming request: PATCH /api/admin/chapters/' + chapter_order);
  console.log('📋 Body:', req.body);

  // ตรวจสอบว่า URL ถูกต้องหรือไม่ (ถ้ามีค่า)
  if (audio_file_url && !isValidUrl(audio_file_url)) {
    return res.status(400).json({ error: 'Invalid audio_file_url' });
  }

  if (txt_file_url && !isValidUrl(txt_file_url)) {
    return res.status(400).json({ error: 'Invalid txt_file_url' });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input('chapter_order', sql.Int, chapter_order)
      .input('title', sql.NVarChar, title)
      .input('audio_file_url', sql.NVarChar, audio_file_url)
      .input('txt_file_url', sql.NVarChar, txt_file_url)
      .query(`
        UPDATE chapters
        SET 
          title = @title,
          audio_file_url = @audio_file_url,
          txt_file_url = @txt_file_url
        WHERE chapter_order = @chapter_order
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'ไม่พบ chapter ที่จะอัปเดต' });
    }

    res.status(200).json({ message: 'อัปเดต chapter สำเร็จ' });
  } catch (err) {
    console.error('❌ Error updating chapter:', err.message);
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการแก้ไขตอน',
      details: err.message,
    });
  }
});


// API สำหรับลบผู้ใช้
app.delete('/api/admin/users/:id', async (req, res) => {
  const userId = req.params.id;
  console.log(`🗑️ DELETE user with ID: ${userId}`);

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('DELETE FROM users WHERE user_id = @user_id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// API สำหรับลบนิยาย
app.delete('/api/admin/novels/:id', async (req, res) => {
  console.log('📥 Incoming request: DELETE /api/admin/novels/:id');
  console.log('Novel ID:', req.params.id);
  
  try {
    const novelId = req.params.id;
    
    if (!novelId || isNaN(novelId)) {
      return res.status(400).json({ 
        error: 'ID นิยายไม่ถูกต้อง' 
      });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }

    // ตรวจสอบว่ามีนิยายนี้อยู่หรือไม่
    const checkResult = await pool.request()
      .input('novelId', sql.Int, novelId)
      .query(`
        SELECT novel_id, title 
        FROM novels 
        WHERE novel_id = @novelId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        error: 'ไม่พบนิยายที่ต้องการลบ' 
      });
    }

    const novel = checkResult.recordset[0];

    // ลบตอนทั้งหมดของนิยายก่อน (Foreign Key Constraint)
    await pool.request()
      .input('novelId', sql.Int, novelId)
      .query(`
        DELETE FROM chapters 
        WHERE novel_id = @novelId
      `);

    // ลบนิยาย
    const deleteResult = await pool.request()
      .input('novelId', sql.Int, novelId)
      .query(`
        DELETE FROM novels 
        WHERE novel_id = @novelId
      `);

    console.log(`✅ Novel deleted successfully: ${novel.title} (ID: ${novelId})`);
    
    res.json({
      success: true,
      message: 'ลบนิยายสำเร็จ',
      deleted: {
        id: novelId,
        title: novel.title
      }
    });

  } catch (error) {
    console.error('❌ Error deleting novel:', error);
    
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการลบนิยาย',
      details: error.message 
    });
  }
});

// API สำหรับลบตอน
// API ลบตอนด้วย chapter_order
app.delete('/api/admin/chapters/:chapterOrder', async (req, res) => {
  console.log('📥 Incoming request: DELETE /api/admin/chapters/:chapterOrder');
  console.log('Chapter Order:', req.params.chapterOrder);
  
  try {
    const chapterOrder = req.params.chapterOrder;
    
    if (!chapterOrder || isNaN(chapterOrder)) {
      return res.status(400).json({ 
        error: 'Chapter Order ไม่ถูกต้อง' 
      });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database connection not ready' });
    }

    // ตรวจสอบว่ามีตอนนี้อยู่หรือไม่
    const checkResult = await pool.request()
      .input('chapterOrder', sql.Int, chapterOrder)
      .query(`
        SELECT c.chapter_id, c.title, c.novel_id, c.chapter_order, n.title as novel_title
        FROM chapters c
        INNER JOIN novels n ON c.novel_id = n.novel_id
        WHERE c.chapter_order = @chapterOrder
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        error: 'ไม่พบตอนที่ต้องการลบ' 
      });
    }

    const chapter = checkResult.recordset[0];

    // ลบตอน
    await pool.request()
      .input('chapterOrder', sql.Int, chapterOrder)
      .query(`
        DELETE FROM chapters 
        WHERE chapter_order = @chapterOrder
      `);

    console.log(`✅ Chapter deleted successfully: ${chapter.title}`);
    
    res.json({
      success: true,
      message: 'ลบตอนสำเร็จ',
      deleted: {
        chapter_id: chapter.chapter_id,
        chapter_order: chapterOrder,
        title: chapter.title,
        novel_title: chapter.novel_title
      }
    });

  } catch (error) {
    console.error('❌ Error deleting chapter:', error);
    
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการลบตอน',
      details: error.message 
    });
  }

// ฟังก์ชันตรวจสอบ URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
