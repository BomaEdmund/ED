
const departments = [
    { name: "Computer Science", icon: "💻", description: "Programming, software development and computing." },
    { name: "Information Technology", icon: "🌐", description: "Networks, information systems and digital technology." },
    { name: "Business Administration", icon: "📊", description: "Management, leadership and business skills." },
    { name: "Accounting", icon: "📈", description: "Financial reporting, auditing and accounting." },
    { name: "Mass Communication", icon: "🎙️", description: "Journalism, broadcasting and media communication." }
];

const defaultStudents = [
    { id: "ED2026001", name: "Amara Johnson", email: "amara@example.com", phone: "08012345678", department: "Computer Science", level: "300 Level" },
    { id: "ED2026002", name: "Daniel Williams", email: "daniel@example.com", phone: "08023456789", department: "Information Technology", level: "200 Level" },
    { id: "ED2026003", name: "Sarah Okafor", email: "sarah@example.com", phone: "08034567890", department: "Accounting", level: "400 Level" },
    { id: "ED2026004", name: "Michael James", email: "michael@example.com", phone: "08045678901", department: "Business Administration", level: "100 Level" }
];

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

let students = loadData("ed_students", defaultStudents);
let results = loadData("ed_results", []);
let attendance = loadData("ed_attendance", {});

function saveData() {
    localStorage.setItem("ed_students", JSON.stringify(students));
    localStorage.setItem("ed_results", JSON.stringify(results));
    localStorage.setItem("ed_attendance", JSON.stringify(attendance));
}

const today = new Date().toLocaleDateString("en-CA");

document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
    });

document.getElementById("attendance-date").value = today;

// NAVIGATION

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => section.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach(button => button.classList.remove("active"));

    document.getElementById(page).classList.add("active");

    const activeButton = document.querySelector(`[data-page="${page}"]`);
    if (activeButton) activeButton.classList.add("active");

    const titles = {
        dashboard: "Dashboard",
        students: "Students",
        courses: "Courses",
        attendance: "Attendance",
        results: "Results"
    };

    document.getElementById("page-title").textContent = titles[page];
    renderAll();
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
});

// MODALS

function openStudentModal() {
    document.getElementById("student-form").reset();
    document.getElementById("edit-student-id").value = "";
    document.getElementById("student-modal-title").textContent = "Add New Student";
    document.getElementById("student-modal").classList.add("show");
    document.getElementById("student-name").focus();
}

function openResultModal() {
    if (!students.length) {
        alert("Please add a student before recording results.");
        return;
    }

    populateResultOptions();
    document.getElementById("result-modal").classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) modal.classList.remove("show");
    });
});

// GENERATE STUDENT ID

function generateStudentId() {
    const year = new Date().getFullYear();
    let number = students.length + 1;
    let id = `ED${year}${String(number).padStart(3, "0")}`;

    while (students.some(student => student.id === id)) {
        number++;
        id = `ED${year}${String(number).padStart(3, "0")}`;
    }

    return id;
}

// ADD AND EDIT STUDENT

document.getElementById("student-form").addEventListener("submit", event => {
    event.preventDefault();

    const editId = document.getElementById("edit-student-id").value;

    const student = {
        id: editId || generateStudentId(),
        name: document.getElementById("student-name").value.trim(),
        email: document.getElementById("student-email").value.trim(),
        phone: document.getElementById("student-phone").value.trim(),
        department: document.getElementById("student-department").value,
        level: document.getElementById("student-level").value
    };

    if (!student.name || !student.email || !student.phone ||
        !student.department || !student.level) {
        alert("Please complete every field.");
        return;
    }

    const duplicateEmail = students.some(existing =>
        existing.email.toLowerCase() === student.email.toLowerCase() &&
        existing.id !== editId
    );

    if (duplicateEmail) {
        alert("This email address is already registered.");
        return;
    }

    if (editId) {
        students = students.map(existing =>
            existing.id === editId ? student : existing
        );
    } else {
        students.push(student);
    }

    saveData();
    closeModal("student-modal");
    renderAll();

    alert(editId ? "Student updated successfully!" : `Student registered successfully! Student ID: ${student.id}`);
    showPage("students");
});

function editStudent(id) {
    const student = students.find(item => item.id === id);
    if (!student) return;

    document.getElementById("edit-student-id").value = student.id;
    document.getElementById("student-name").value = student.name;
    document.getElementById("student-email").value = student.email;
    document.getElementById("student-phone").value = student.phone || "";
    document.getElementById("student-department").value = student.department;
    document.getElementById("student-level").value = student.level;

    document.getElementById("student-modal-title").textContent = "Edit Student Details";
    document.getElementById("student-modal").classList.add("show");
}

function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    students = students.filter(student => student.id !== id);
    results = results.filter(result => result.studentId !== id);

    Object.values(attendance).forEach(records => {
        delete records[id];
    });

    saveData();
    renderAll();
}

// HTML ESCAPING

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// STUDENT TABLE

function renderStudents() {
    const search = document.getElementById("student-search").value.toLowerCase();
    const department = document.getElementById("department-filter").value;

    const filtered = students.filter(student => {
        const matchesSearch =
            student.name.toLowerCase().includes(search) ||
            student.id.toLowerCase().includes(search) ||
            student.email.toLowerCase().includes(search);

        return matchesSearch && (!department || student.department === department);
    });

    const table = document.getElementById("student-table");

    if (!filtered.length) {
        table.innerHTML = `<tr><td colspan="6">No students found. Click "Add Student" to register one.</td></tr>`;
        return;
    }

    table.innerHTML = filtered.map(student => `
        <tr>
            <td>
                <span class="student-name">${escapeHTML(student.name)}</span>
                <span class="student-sub">${escapeHTML(student.phone || "")}</span>
            </td>
            <td>${escapeHTML(student.id)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td>${escapeHTML(student.department)}</td>
            <td>${escapeHTML(student.level)}</td>
            <td>
                <button class="action-btn" onclick="editStudent('${student.id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteStudent('${student.id}')">Delete</button>
            </td>
        </tr>
    `).join("");
}

function renderRecentStudents() {
    const recent = [...students].slice(-5).reverse();
    const table = document.getElementById("recent-students");

    if (!recent.length) {
        table.innerHTML = `<tr><td colspan="5">No students registered yet.</td></tr>`;
        return;
    }

    table.innerHTML = recent.map(student => `
        <tr>
            <td>
                <span class="student-name">${escapeHTML(student.name)}</span>
                <span class="student-sub">${escapeHTML(student.email)}</span>
            </td>
            <td>${escapeHTML(student.id)}</td>
            <td>${escapeHTML(student.department)}</td>
            <td>${escapeHTML(student.level)}</td>
            <td><span class="status">Active</span></td>
        </tr>
    `).join("");
}

// COURSES

function renderCourses() {
    document.getElementById("course-grid").innerHTML = departments.map(department => `
        <div class="course-card">
            <div class="course-icon">${department.icon}</div>
            <h3>${escapeHTML(department.name)}</h3>
            <p>${escapeHTML(department.description)}</p>
        </div>
    `).join("");
}

// ATTENDANCE

function renderAttendance() {
    const date = document.getElementById("attendance-date").value || today;
    const records = attendance[date] || {};
    const table = document.getElementById("attendance-table");

    if (!students.length) {
        table.innerHTML = `<tr><td colspan="4">Add students before recording attendance.</td></tr>`;
        return;
    }

    table.innerHTML = students.map(student => `
        <tr>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.id)}</td>
            <td>${escapeHTML(student.department)}</td>
            <td>
                <select class="attendance-choice" data-id="${student.id}">
                    <option value="Not marked" ${(!records[student.id] || records[student.id] === "Not marked") ? "selected" : ""}>Not marked</option>
                    <option value="Present" ${records[student.id] === "Present" ? "selected" : ""}>Present</option>
                    <option value="Absent" ${records[student.id] === "Absent" ? "selected" : ""}>Absent</option>
                </select>
            </td>
        </tr>
    `).join("");
}

function saveAttendance() {
    const date = document.getElementById("attendance-date").value;
    if (!date) return alert("Please select a date.");

    attendance[date] = {};

    document.querySelectorAll(".attendance-choice").forEach(select => {
        attendance[date][select.dataset.id] = select.value;
    });

    saveData();
    renderAll();
    alert("Attendance saved successfully!");
}

// RESULTS

function gradeFromScore(score) {
    if (score >= 70) return "A";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    if (score >= 45) return "D";
    if (score >= 40) return "E";
    return "F";
}

function populateResultOptions() {
    document.getElementById("result-student").innerHTML = students.map(student => `
        <option value="${student.id}">${escapeHTML(student.name)} (${escapeHTML(student.id)})</option>
    `).join("");

    document.getElementById("result-course").innerHTML = departments.map(department => `
        <option value="${escapeHTML(department.name)}">${escapeHTML(department.name)}</option>
    `).join("");
}

document.getElementById("result-form").addEventListener("submit", event => {
    event.preventDefault();

    const studentId = document.getElementById("result-student").value;
    const course = document.getElementById("result-course").value;
    const score = Number(document.getElementById("result-score").value);

    if (!Number.isFinite(score) || score < 0 || score > 100) {
        alert("Enter a score between 0 and 100.");
        return;
    }

    const student = students.find(item => item.id === studentId);
    if (!student) return;

    results.push({
        id: Date.now(),
        studentId,
        studentName: student.name,
        course,
        score,
        grade: gradeFromScore(score)
    });

    saveData();
    closeModal("result-modal");
    document.getElementById("result-form").reset();
    renderAll();
    alert("Result added successfully!");
});

function deleteResult(id) {
    if (!confirm("Delete this result?")) return;

    results = results.filter(result => result.id !== id);
    saveData();
    renderAll();
}

function renderResults() {
    const table = document.getElementById("results-table");

    if (!results.length) {
        table.innerHTML = `<tr><td colspan="6">No results have been added yet.</td></tr>`;
        return;
    }

    table.innerHTML = results.map(result => `
        <tr>
            <td>${escapeHTML(result.studentName)}</td>
            <td>${escapeHTML(result.studentId)}</td>
            <td>${escapeHTML(result.course)}</td>
            <td>${result.score}/100</td>
            <td><span class="status">${result.grade}</span></td>
            <td><button class="action-btn delete-btn" onclick="deleteResult(${result.id})">Delete</button></td>
        </tr>
    `).join("");
}

// DASHBOARD

function renderDashboard() {
    document.getElementById("total-students").textContent = students.length;
    document.getElementById("total-courses").textContent = departments.length;
    document.getElementById("results-count").textContent = results.length;

    const records = attendance[today] || {};
    const present = Object.values(records).filter(value => value === "Present").length;

    document.getElementById("present-count").textContent = present;
    renderRecentStudents();
}

// SEARCH AND FILTER

document.getElementById("student-search").addEventListener("input", renderStudents);
document.getElementById("department-filter").addEventListener("change", renderStudents);
document.getElementById("attendance-date").addEventListener("change", renderAttendance);

// RENDER ALL

function renderAll() {
    renderDashboard();
    renderStudents();
    renderCourses();
    renderAttendance();
    renderResults();
}

renderAll();
console.log("ED JavaScript is working!");