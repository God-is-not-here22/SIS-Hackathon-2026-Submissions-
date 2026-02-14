const form = document.getElementById('reportForm');
const resultDiv = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const symptoms = Array.from(
    document.querySelectorAll('input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);

  const response = await fetch('/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symptoms,
      location: { lat, lng }
    })
  });

  const data = await response.json();

  const volunteerText = data.volunteers.length === 0
  ? "No volunteers found"
  : data.volunteers
      .map(v => `${v.name} (${v.distance.toFixed(2)} km)`)
      .join(", ");

resultDiv.innerHTML = `
<p>
Severity: ${data.severity} | Urgency: ${data.urgencyScore} | Clinic: ${data.recommendedClinic.name} (${data.recommendedClinic.distance.toFixed(2)} km) | Volunteers: ${volunteerText}
</p>
`; 
});