// INICIJALIZACIJA
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  prikaziPregled();
});

// POMOĆNE FUNKCIJE
function spremiKorisnika(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
  let users = JSON.parse(localStorage.getItem("users")) || [];
  users = users.map(u => u.username === user.username ? user : u);
  localStorage.setItem("users", JSON.stringify(users));
}

function obrisiUnose(ids) {
  ids.forEach(id => document.getElementById(id).value = "");
}

// DODAVANJE PRIHODA I TROŠKOVA
function dodajPrihod() {
  const datum = document.getElementById("prihodDatum").value;
  const kategorija = document.getElementById("prihodKategorija").value;
  const iznos = parseFloat(document.getElementById("prihodIznos").value);
  const napomena = document.getElementById("prihodNapomena").value;

  if (!datum || isNaN(iznos) || iznos <= 0) return alert("Unesite ispravan datum i iznos.");

  const user = JSON.parse(localStorage.getItem("currentUser"));
  user.prihodi = user.prihodi || [];
  user.prihodi.push({ datum, kategorija, iznos, napomena });
  spremiKorisnika(user);
  obrisiUnose(["prihodDatum", "prihodIznos", "prihodNapomena"]);
  alert("Prihod dodan.");
  prikaziPregled();
}

function dodajTrosak() {
  const datum = document.getElementById("trosakDatum").value;
  const kategorija = document.getElementById("trosakKategorija").value;
  const iznos = parseFloat(document.getElementById("trosakIznos").value);
  const napomena = document.getElementById("trosakNapomena").value;

  if (!datum || isNaN(iznos) || iznos <= 0) return alert("Unesite ispravan datum i iznos.");

  const user = JSON.parse(localStorage.getItem("currentUser"));
  user.troskovi = user.troskovi || [];
  user.troskovi.push({ datum, kategorija, iznos, napomena });
  spremiKorisnika(user);
  obrisiUnose(["trosakDatum", "trosakIznos", "trosakNapomena"]);
  alert("Trošak dodan.");
  prikaziPregled();
}

// GRUPIRANJE PO MJESECIMA I GODINAMA
function grupirajPoMjesecima(prihodi, troskovi) {
  const grouped = {};

  function dodajUGrupu(lista, tip) {
    lista.forEach(entry => {
      const [godina, mjesec] = entry.datum.split("-");
      if (!grouped[godina]) grouped[godina] = {};
      if (!grouped[godina][mjesec]) grouped[godina][mjesec] = { prihodi: [], troskovi: [] };
      grouped[godina][mjesec][tip].push(entry);
    });
  }

  dodajUGrupu(prihodi, "prihodi");
  dodajUGrupu(troskovi, "troskovi");

  return grouped;
}

function nazivMjeseca(mjesec) {
  const mjeseci = {
    "01": "Siječanj", "02": "Veljača", "03": "Ožujak", "04": "Travanj",
    "05": "Svibanj", "06": "Lipanj", "07": "Srpanj", "08": "Kolovoz",
    "09": "Rujan", "10": "Listopad", "11": "Studeni", "12": "Prosinac"
  };
  return mjeseci[mjesec] || mjesec;
}

// PRIKAZ PREGLEDA
function prikaziPregled() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const prihodi = user.prihodi || [];
  const troskovi = user.troskovi || [];

  const grouped = grupirajPoMjesecima(prihodi, troskovi);
  const accordion = document.getElementById("accordionFinancije");
  accordion.innerHTML = "";

  for (const godina in grouped) {
    const godinaDiv = document.createElement("div");
    godinaDiv.className = "accordion-godina";

    const godinaHeader = document.createElement("h3");
    godinaHeader.textContent = `Godina ${godina}`;
    godinaHeader.onclick = () => godinaDiv.classList.toggle("open");
    godinaDiv.appendChild(godinaHeader);

    for (const mjesec in grouped[godina]) {
      const mjesecDiv = document.createElement("div");
      mjesecDiv.className = "accordion-mjesec";

      const mjesecHeader = document.createElement("h4");
      mjesecHeader.textContent = nazivMjeseca(mjesec);
      mjesecHeader.onclick = () => mjesecDiv.classList.toggle("open");
      mjesecDiv.appendChild(mjesecHeader);

      const prihodiTablica = generirajTablicu(grouped[godina][mjesec].prihodi, "Prihodi");
      const troskoviTablica = generirajTablicu(grouped[godina][mjesec].troskovi, "Troskovi");

      mjesecDiv.appendChild(prihodiTablica);
      mjesecDiv.appendChild(troskoviTablica);

      const ukupnoPrihodi = grouped[godina][mjesec].prihodi.reduce((s, p) => s + p.iznos, 0);
      const ukupnoTroskovi = grouped[godina][mjesec].troskovi.reduce((s, t) => s + t.iznos, 0);

      const ukupnoDiv = document.createElement("div");
      ukupnoDiv.className = "ukupno-row";
      ukupnoDiv.innerHTML = `<strong>Ukupno prihodi:</strong> ${ukupnoPrihodi.toFixed(2)} € | 
        <strong>Ukupno troškovi:</strong> ${ukupnoTroskovi.toFixed(2)} € | 
        <strong>Ušteda:</strong> ${(ukupnoPrihodi - ukupnoTroskovi).toFixed(2)} €`;

      mjesecDiv.appendChild(ukupnoDiv);
      godinaDiv.appendChild(mjesecDiv);
    }
    // GODIŠNJI SAŽETAK
let ukupnoGodisnjiPrihodi = 0;
let ukupnoGodisnjiTroskovi = 0;

for (const mjesec in grouped[godina]) {
  ukupnoGodisnjiPrihodi += grouped[godina][mjesec].prihodi.reduce((s, p) => s + p.iznos, 0);
  ukupnoGodisnjiTroskovi += grouped[godina][mjesec].troskovi.reduce((s, t) => s + t.iznos, 0);
}

const godisnjiDiv = document.createElement("div");
godisnjiDiv.className = "ukupno-row";
godisnjiDiv.innerHTML = `
  <strong>Ukupno za ${godina}:</strong><br>
  Prihodi: ${ukupnoGodisnjiPrihodi.toFixed(2)} €<br>
  Troškovi: ${ukupnoGodisnjiTroskovi.toFixed(2)} €<br>
  Ušteda: ${(ukupnoGodisnjiPrihodi - ukupnoGodisnjiTroskovi).toFixed(2)} €
`;

godinaDiv.appendChild(godisnjiDiv);


    accordion.appendChild(godinaDiv);
  }
}

// TABLICA, UREĐIVANJE I BRISANJE
function generirajTablicu(data, tip) {
  const table = document.createElement("table");
  table.classList.add("financije-table");

  const header = document.createElement("tr");
  header.innerHTML = `
    <th>Datum</th>
    <th>Kategorija</th>
    <th>Iznos (€)</th>
    <th>Bilješka</th>
    <th>Uredi</th>
    <th>Obriši</th>
  `;
  table.appendChild(header);

  data.forEach((entry, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input type="date" value="${entry.datum}" onchange="urediUnos('${tip}', ${index}, 'datum', this.value)" /></td>
      <td><input type="text" value="${entry.kategorija}" onchange="urediUnos('${tip}', ${index}, 'kategorija', this.value)" /></td>
      <td><input type="number" value="${entry.iznos}" onchange="urediUnos('${tip}', ${index}, 'iznos', this.value)" /></td>
      <td><input type="text" value="${entry.napomena}" onchange="urediUnos('${tip}', ${index}, 'napomena', this.value)" /></td>
      <td><button onclick="alert('Promjena spremljena automatski.')">✏️</button></td>
      <td><button onclick="obrisiUnos('${tip}', ${index})">🗑️</button></td>
    `;

    table.appendChild(row);
  });

  return table;
}

function urediUnos(tip, index, polje, novaVrijednost) {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const lista = tip === "Prihodi" ? user.prihodi : user.troskovi;

  if (!lista[index]) return;

  lista[index][polje] = polje === "iznos" ? parseFloat(novaVrijednost) : novaVrijednost;
  spremiKorisnika(user);
  prikaziPregled();
}

function obrisiUnos(tip, index) {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) return;

  if (tip === "Prihodi") {
    user.prihodi.splice(index, 1);
  } else if (tip === "Troskovi") {
    user.troskovi.splice(index, 1);
  }

  spremiKorisnika(user);
  prikaziPregled();
}

