const locations = [
  {
    id: 1,
    name: "Main Library",
    description: "Study spaces and learning resources",
    icon: "📚",
    x: 7,
    y: 12,
    facilities: ["ramp", "lift", "stepfree"],
    status: "good",
    checked: "Demo sample — not verified"
  },
  {
    id: 2,
    name: "Science Block",
    description: "Science labs and classrooms",
    icon: "🔬",
    x: 75,
    y: 18,
    facilities: ["lift", "washroom"],
    status: "check",
    checked: "Needs on-site checking"
  },
  {
    id: 3,
    name: "Student Centre",
    description: "Student services and common areas",
    icon: "🏫",
    x: 24,
    y: 75,
    facilities: ["ramp", "stepfree", "washroom"],
    status: "good",
    checked: "Demo sample — not verified"
  },
  {
    id: 4,
    name: "Sports Complex",
    description: "Indoor and outdoor sports facilities",
    icon: "🏟️",
    x: 70,
    y: 77,
    facilities: ["ramp", "stepfree"],
    status: "check",
    checked: "Needs on-site checking"
  },
  {
    id: 5,
    name: "Admin Building",
    description: "Admissions and administrative offices",
    icon: "🏢",
    x: 48,
    y: 45,
    facilities: ["lift", "ramp", "washroom"],
    status: "good",
    checked: "Demo sample — not verified"
  }
];

const facilityNames = {
  ramp: "Ramp",
  lift: "Lift",
  washroom: "Accessible washroom",
  stepfree: "Step-free entrance"
};

const statusInfo = {
  good: {
    label: "Sample: accessible",
    className: "status-good"
  },
  check: {
    label: "Needs a fresh check",
    className: "status-check"
  },
  alert: {
    label: "Barrier reported",
    className: "status-alert"
  }
};

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const locationGrid = document.getElementById("locationGrid");
const mapPins = document.getElementById("mapPins");
const emptyMessage = document.getElementById("emptyMessage");
const reportForm = document.getElementById("reportForm");
const reportLocation = document.getElementById("reportLocation");
const reportType = document.getElementById("reportType");
const reportDescription = document.getElementById("reportDescription");
const formMessage = document.getElementById("formMessage");
const reportsList = document.getElementById("reportsList");

function readSavedReports() {
  try {
    const saved = localStorage.getItem("accessmap-reports");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let reports = readSavedReports();

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getLocationStatus(location) {
  if (location.status === "alert") return statusInfo.alert;
  if (location.status === "check") return statusInfo.check;
  return statusInfo.good;
}

function getVisibleLocations() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedType = typeFilter.value;

  return locations.filter(location => {
    const matchesSearch =
      location.name.toLowerCase().includes(query) ||
      location.description.toLowerCase().includes(query) ||
      location.facilities.some(type =>
        facilityNames[type].toLowerCase().includes(query)
      );

    const matchesType =
      selectedType === "all" ||
      location.facilities.includes(selectedType);

    return matchesSearch && matchesType;
  });
}

function renderLocations() {
  const visible = getVisibleLocations();

  locationGrid.innerHTML = visible.map(location => {
    const status = getLocationStatus(location);

    const tags = location.facilities.map(type =>
      `<span class="facility-tag">${escapeHTML(facilityNames[type])}</span>`
    ).join("");

    return `
      <article class="location-card">
        <div class="card-top">
          <span class="building-icon" aria-hidden="true">
            ${location.icon}
          </span>
          <span class="status ${status.className}">
            ${escapeHTML(status.label)}
          </span>
        </div>
        <h3>${escapeHTML(location.name)}</h3>
        <p>${escapeHTML(location.description)}</p>
        <div class="facility-list">${tags}</div>
        <div class="card-meta">
          ${escapeHTML(location.checked)}
        </div>
      </article>
    `;
  }).join("");

  emptyMessage.hidden = visible.length !== 0;

  mapPins.innerHTML = visible.map(location => {
    const status = getLocationStatus(location);

    return `
      <button class="map-pin"
        type="button"
        style="left:${location.x}%;top:${location.y}%"
        data-location-id="${location.id}"
        aria-label="Report an issue at ${escapeHTML(location.name)}">
        ${location.icon} ${escapeHTML(location.name)}
        <small>${escapeHTML(status.label)}</small>
      </button>
    `;
  }).join("");

  document.getElementById("locationCount").textContent =
    locations.length;

  document.getElementById("accessibleCount").textContent =
    locations.filter(location => location.status === "good").length;

  document.getElementById("reportCount").textContent = reports.length;
}

function renderReportOptions() {
  reportLocation.innerHTML = `
    <option value="">Choose a location</option>
    ${locations.map(location => `
      <option value="${location.id}">
        ${escapeHTML(location.name)}
      </option>
    `).join("")}
  `;
}

function renderReports() {
  if (reports.length === 0) {
    reportsList.innerHTML = `
      <div class="report-card">
        <p>No reports yet. Your first report can help improve campus access.</p>
      </div>
    `;
    return;
  }

  reportsList.innerHTML = [...reports].reverse().map(report => `
    <article class="report-card">
      <span class="status status-alert">Needs review</span>
      <h3>${escapeHTML(report.type)}</h3>
      <p><strong>Location:</strong> ${escapeHTML(report.locationName)}</p>
      <p>${escapeHTML(report.description)}</p>
      <p class="report-date">Submitted ${escapeHTML(report.date)}</p>
    </article>
  `).join("");
}

searchInput.addEventListener("input", renderLocations);
typeFilter.addEventListener("change", renderLocations);

mapPins.addEventListener("click", event => {
  const pin = event.target.closest("[data-location-id]");
  if (!pin) return;

  reportLocation.value = pin.dataset.locationId;
  document.getElementById("report").scrollIntoView({
    behavior: "smooth"
  });
  reportType.focus();
});

reportForm.addEventListener("submit", event => {
  event.preventDefault();

  const selectedId = Number(reportLocation.value);
  const location = locations.find(item => item.id === selectedId);
  const type = reportType.value;
  const description = reportDescription.value.trim();

  if (!location || !type || !description) {
    formMessage.textContent = "Please complete all fields.";
    return;
  }

  const report = {
    id: Date.now(),
    locationId: location.id,
    locationName: location.name,
    type,
    description,
    date: new Date().toLocaleString()
  };

  reports.push(report);

  try {
    localStorage.setItem("accessmap-reports", JSON.stringify(reports));
  } catch {
    reports.pop();
    formMessage.textContent =
      "Unable to save this report in your browser. Please try again.";
    return;
  }

  // A report flags the location for review.
  // It does not mean the barrier has been independently verified.
  location.status = "alert";
  location.checked = "Barrier report submitted — needs review";

  formMessage.textContent =
    "Report submitted! This location is now flagged for review.";

  reportForm.reset();
  renderLocations();
  renderReports();
});

renderReportOptions();
renderLocations();
renderReports();
const startPoint = document.getElementById("startPoint");
const destination = document.getElementById("destination");
const checkRoute = document.getElementById("checkRoute");
const routeResult = document.getElementById("routeResult");

function populateDestinations() {
  destination.innerHTML = `
    <option value="">Choose a destination</option>
    ${locations.map(location => `
      <option value="${location.id}">
        ${escapeHTML(location.name)}
      </option>
    `).join("")}
  `;
}

checkRoute.addEventListener("click", () => {
  const selectedId = Number(destination.value);
  const location = locations.find(item => item.id === selectedId);

  if (!location) {
    routeResult.hidden = false;
    routeResult.className = "route-result route-warning";
    routeResult.innerHTML = `
      <div class="route-icon">⚠️</div>
      <h3>Choose a destination</h3>
      <p>Select where you want to go and we'll check the demo route.</p>
    `;
    return;
  }

  routeResult.hidden = false;

  if (location.status === "alert") {
    routeResult.className = "route-result route-warning";
    routeResult.innerHTML = `
      <div class="route-icon">⚠️</div>
      <h3>Route needs attention</h3>
      <p>
        A reported accessibility barrier exists at
        <strong>${escapeHTML(location.name)}</strong>.
      </p>
      <p>
        Check the latest community report before starting your journey.
      </p>
    `;
  } else {
    routeResult.className = "route-result route-success";
    routeResult.innerHTML = `
      <div class="route-icon">♿</div>
      <h3>Demo route looks accessible</h3>
      <p>
        No reported accessibility barriers were found for
        <strong>${escapeHTML(location.name)}</strong>.
      </p>
      <p>
        Always confirm current conditions on site.
      </p>
    `;
  }
});

populateDestinations();