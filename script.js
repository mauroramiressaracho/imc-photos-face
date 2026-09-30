const DRIVE_FOLDER_ID = "18KOtwcU9QB0Moqr9uIaU342O2WexxaYb";

const photos = [
  {id:"16AN-a502OQre1uyIzm79YlaI7fRZ5Q5Y",name:"5890eca1-b3da-41a9-b2f8-0f129cb952b8.jpg",cat:"social"},
  {id:"1h_bf-WpOLZ5rnr5hK4nobkXfUycAhonx",name:"d82bca7b-bd1c-4041-b95a-1f8c5a37e388.jpg",cat:"social"},
  {id:"1KIwVo4X8uO4b79Ey1IyYoj0S09eXr5F7",name:"IMG_20260117_164144.jpg",cat:"evento"},
  {id:"1g2xqr5_IfnppaesA4rceaZvnnYOX5xrP",name:"IMG_20260117_164141.jpg",cat:"evento"},
  {id:"1cG_YSchGQGtZULpMuX2qMLwvRaILJFq4",name:"IMG_20260117_163523.jpg",cat:"evento"},
  {id:"1qpTVzNmvHu0vus4kCRIV9eknaUvhKFqv",name:"IMG_20260117_162515.jpg",cat:"evento"},
  {id:"1RtQcD-A_Li-XS4rsmasjyXx-ollUITn9",name:"IMG_20260117_162511.jpg",cat:"evento"},
  {id:"1N-04PxQbr8ZwUPddGjrmeTBfPHqImn8p",name:"IMG_20260117_162513.jpg",cat:"evento"},
  {id:"1Bw_HsF0rwgDy4GTKkga6xBtYO4NOg7Yg",name:"IMG_20260117_162456.jpg",cat:"evento"},
  {id:"12OVlJjPADkTaLsfiFn-xKdtwrx4S2q4L",name:"IMG_20260117_162453.jpg",cat:"evento"},
  {id:"15H8hX6vhaCRyY67QQMIcejFvJTzuKjXo",name:"IMG_20260117_162435.jpg",cat:"evento"},
  {id:"1NrvZd3gB6CPMYi9ulLLLtVi4hvuTh8zt",name:"IMG_20260117_162431.jpg",cat:"evento"},
  {id:"13-g8jaszvjyoBE-BebGNB6h5IpMBbQ84",name:"IMG_20260117_162433.jpg",cat:"evento"},
  {id:"142vukxIAT6wU3DALd6mQwX9RdNtMAS7A",name:"IMG_20260117_162410.jpg",cat:"evento"},
  {id:"17HJ3gELBh7nqLziPUJqO5Tp69BU7x2LX",name:"IMG_20260117_162405.jpg",cat:"evento"},
  {id:"14oIdzD8HGU9X02QKTcOi7uQ7tV2S7K3z",name:"IMG_20260117_162337.jpg",cat:"evento"},
  {id:"1Wi99SqLv-2RPnYNX1o29syMBYEA3qI5p",name:"IMG_20260117_161828.jpg",cat:"evento"},
  {id:"13cw0556OGo6KL75N7vYVw0ClvJvk4cbO",name:"IMG_20260117_161718.jpg",cat:"evento"},
  {id:"1vnrUfiuLnmEhc0MfusO6uc0Ik3BkLsyr",name:"IMG_20260117_161423.jpg",cat:"evento"},
  {id:"1hZviqJkBlR-KtWBP_RQCcXHnw1eJJU6x",name:"IMG_20260117_161426.jpg",cat:"evento"}
];

const gallery = document.getElementById("gallery");
const loadStatus = document.getElementById("loadStatus");
const photoCount = document.getElementById("photoCount");
const viewer = document.getElementById("viewer");
const viewerImg = document.getElementById("viewerImg");
const openOriginal = document.getElementById("openOriginal");

function thumb(id, size=900){ return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`; }
function original(id){ return `https://drive.google.com/file/d/${id}/view`; }

function render(filter="all"){
  gallery.innerHTML="";
  const list = photos.filter(p => filter==="all" || p.cat===filter);
  list.forEach((p,i)=>{
    const card=document.createElement("article");
    card.className="photo-card";
    card.dataset.category=p.cat;
    const img=document.createElement("img");
    img.loading="lazy";
    img.decoding="async";
    img.alt=`Foto ${i+1} - Regional Campo Grande/MS`;
    img.src=thumb(p.id);
    img.onerror=()=>{ img.style.opacity=".2"; card.title="A imagem exige permissão pública no Google Drive"; };
    const meta=document.createElement("div");
    meta.className="photo-meta";
    meta.innerHTML=`<span>IMC PHOTOS</span><span>AMPLIAR ↗</span>`;
    card.append(img,meta);
    card.addEventListener("click",()=>{
      viewerImg.src=thumb(p.id,1800);
      openOriginal.href=original(p.id);
      viewer.showModal();
    });
    gallery.appendChild(card);
  });
  photoCount.textContent = photos.length.toLocaleString("pt-BR");
  loadStatus.textContent = `${list.length} fotos carregadas nesta versão de teste`;
}

document.querySelectorAll(".filter").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    render(btn.dataset.filter);
  });
});

document.getElementById("closeViewer").onclick=()=>viewer.close();
viewer.addEventListener("click",e=>{if(e.target===viewer)viewer.close()});

const findModal=document.getElementById("findModal");
document.querySelectorAll("[data-open-find]").forEach(el=>el.addEventListener("click",()=>findModal.showModal()));
document.getElementById("closeFind").onclick=()=>findModal.close();
findModal.addEventListener("click",e=>{if(e.target===findModal)findModal.close()});

const input=document.getElementById("selfieInput");
const previewWrap=document.getElementById("previewWrap");
const preview=document.getElementById("selfiePreview");
const searchButton=document.getElementById("searchFace");

let faceStatus=document.getElementById("faceStatus");
if(!faceStatus){
  faceStatus=document.createElement("div");
  faceStatus.id="faceStatus";
  faceStatus.style.marginTop="12px";
  faceStatus.style.padding="14px 16px";
  faceStatus.style.border="1px solid #3a3a3a";
  faceStatus.style.background="#111";
  faceStatus.style.color="#d7d7d7";
  faceStatus.style.fontSize="12px";
  faceStatus.style.lineHeight="1.55";
  faceStatus.style.display="none";
  searchButton.insertAdjacentElement("afterend", faceStatus);
}

input.addEventListener("change",()=>{
  const file=input.files?.[0];
  if(!file)return;
  preview.src=URL.createObjectURL(file);
  previewWrap.hidden=false;
  faceStatus.style.display="none";
  searchButton.disabled=false;
  searchButton.textContent="PROCURAR MINHAS FOTOS";
});

document.getElementById("searchFace").onclick=()=>{
  if(!input.files?.[0]){
    faceStatus.style.display="block";
    faceStatus.style.borderColor="#8a6a00";
    faceStatus.innerHTML="<strong style='color:#f1c40f'>Selecione uma selfie primeiro.</strong>";
    return;
  }

  searchButton.disabled=true;
  searchButton.textContent="ANALISANDO...";
  faceStatus.style.display="block";
  faceStatus.style.borderColor="#8a6a00";
  faceStatus.innerHTML="<strong style='color:#f1c40f'>Primeiro teste concluído:</strong><br>A selfie foi carregada corretamente. O reconhecimento facial real ainda não está conectado ao site. Para localizar suas fotos de verdade, precisamos agora ligar o backend com InsightFace e o índice das fotos do Google Drive.";

  setTimeout(()=>{
    searchButton.disabled=false;
    searchButton.textContent="PROCURAR MINHAS FOTOS";
  },900);
};

document.getElementById("menuBtn").onclick=()=>document.getElementById("nav").classList.toggle("open");
document.querySelectorAll("#nav a").forEach(a=>a.onclick=()=>document.getElementById("nav").classList.remove("open"));

render();
