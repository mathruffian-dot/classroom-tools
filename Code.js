/**
 * Classroom 自動化工具（三師爸）
 *
 * 第一次執行任一函式時，Google 會跳出「授權」視窗，請用你的教師帳號同意。
 * 使用前置：見同資料夾 README.md 的「一次性設定」。
 *
 * 用法：在 Apps Script 編輯器上方選一個函式 → 按「執行」→ 看「執行記錄」。
 * 提示：先把下面的 COURSE_ID 換成 listCourses() 查到的課程 id。
 */

const COURSE_ID = 'COURSE_ID'; // ← 換成 listCourses() 查到的 id

// ── 1. 列出你所有的課程（先跑這個，順便完成授權，並抄下想操作的 courseId）──
function listCourses() {
  const res = Classroom.Courses.list({ pageSize: 100 });
  const courses = res.courses || [];
  if (!courses.length) {
    Logger.log('沒有找到課程（確認登入的是有 Classroom 課程的教師帳號）');
    return;
  }
  courses.forEach(c => Logger.log('%s ｜ 狀態=%s ｜ id=%s', c.name, c.courseState, c.id));
  return courses;
}

// ── 2. 列出某課程的學生名單 ──
function listStudents() {
  const res = Classroom.Courses.Students.list(COURSE_ID, { pageSize: 200 });
  const students = res.students || [];
  if (!students.length) { Logger.log('這門課目前沒有學生'); return; }
  students.forEach(s => Logger.log('%s <%s>', s.profile.name.fullName, s.profile.emailAddress || '（無 email 權限）'));
  return students;
}

// ── 3. 在某課程張貼一則公告 ──
function postAnnouncement() {
  const announcement = Classroom.Courses.Announcements.create({
    text: '這是用 Apps Script 自動張貼的公告 🐾',
    state: 'PUBLISHED'
  }, COURSE_ID);
  Logger.log('已張貼公告：%s', announcement.alternateLink);
  return announcement;
}

// ── 4. 建立一份作業 ──
function createAssignment() {
  const work = Classroom.Courses.CourseWork.create({
    title: '範例作業：AI 決策大腦五問',
    description: '用五問判斷器分析一個你的教學任務，寫下你的判斷。',
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
    maxPoints: 100
  }, COURSE_ID);
  Logger.log('已建立作業：%s', work.alternateLink);
  return work;
}

// ── 5. 列出某課程的所有作業與 id（要針對單一作業操作時用）──
function listCourseWork() {
  const res = Classroom.Courses.CourseWork.list(COURSE_ID, { pageSize: 100, orderBy: 'dueDate desc' });
  const works = res.courseWork || [];
  if (!works.length) { Logger.log('這門課目前沒有作業'); return; }
  works.forEach(w => Logger.log('%s ｜ 類型=%s ｜ id=%s', w.title, w.workType, w.id));
  return works;
}

// ── 6.（主力）把某課程「所有作業的交件狀況」匯出成一份新的 Google 試算表 ──
function exportSubmissionsToSheet() {
  // 建立 userId -> 姓名/email 對照
  const nameById = {};
  let token;
  do {
    const r = Classroom.Courses.Students.list(COURSE_ID, { pageSize: 100, pageToken: token });
    (r.students || []).forEach(s => {
      nameById[s.userId] = { name: s.profile.name.fullName, email: s.profile.emailAddress || '' };
    });
    token = r.nextPageToken;
  } while (token);

  const STATE = {
    NEW: '未開始', CREATED: '已指派未交', TURNED_IN: '已繳交',
    RETURNED: '已發還', RECLAIMED_BY_STUDENT: '學生收回'
  };

  const rows = [['學生', 'Email', '作業標題', '狀態', '遲交', '分數', '更新時間']];

  // 逐一作業 → 逐一交件
  let cwToken;
  do {
    const cwRes = Classroom.Courses.CourseWork.list(COURSE_ID, { pageSize: 100, pageToken: cwToken });
    (cwRes.courseWork || []).forEach(cw => {
      let subToken;
      do {
        const subRes = Classroom.Courses.CourseWork.StudentSubmissions.list(COURSE_ID, cw.id, { pageSize: 100, pageToken: subToken });
        (subRes.studentSubmissions || []).forEach(sub => {
          const who = nameById[sub.userId] || { name: sub.userId, email: '' };
          rows.push([
            who.name, who.email, cw.title,
            STATE[sub.state] || sub.state,
            sub.late ? '遲交' : '',
            (sub.assignedGrade != null ? sub.assignedGrade : ''),
            sub.updateTime || ''
          ]);
        });
        subToken = subRes.nextPageToken;
      } while (subToken);
    });
    cwToken = cwRes.nextPageToken;
  } while (cwToken);

  if (rows.length === 1) { Logger.log('沒有任何交件資料（確認 COURSE_ID 正確、且課程有作業與學生）'); return; }

  const course = Classroom.Courses.get(COURSE_ID);
  const title = '交件狀況 - ' + course.name + ' - ' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd');
  const ss = SpreadsheetApp.create(title);
  const sheet = ss.getActiveSheet();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sheet.autoResizeColumns(1, rows[0].length);

  Logger.log('已匯出 %s 列（含表頭）：%s', rows.length, ss.getUrl());
  return ss.getUrl();
}
