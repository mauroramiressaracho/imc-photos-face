const photos=[
{id:"16AN-a502OQre1uyIzm79YlaI7fRZ5Q5Y",cat:"social"},{id:"1h_bf-WpOLZ5rnr5hK4nobkXfUycAhonx",cat:"social"},
{id:"1KIwVo4X8uO4b79Ey1IyYoj0S09eXr5F7",cat:"evento"},{id:"1g2xqr5_IfnppaesA4rceaZvnnYOX5xrP",cat:"evento"},
{id:"1cG_YSchGQGtZULpMuX2qMLwvRaILJFq4",cat:"evento"},{id:"1qpTVzNmvHu0vus4kCRIV9eknaUvhKFqv",cat:"evento"},
{id:"1RtQcD-A_Li-XS4rsmasjyXx-ollUITn9",cat:"evento"},{id:"1N-04PxQbr8ZwUPddGjrmeTBfPHqImn8p",cat:"evento"},
{id:"1Bw_HsF0rwgDy4GTKkga6xBtYO4NOg7Yg",cat:"evento"},{id:"12OVlJjPADkTaLsfiFn-xKdtwrx4S2q4L",cat:"evento"},
{id:"15H8hX6vhaCRyY67QQMIcejFvJTzuKjXo",cat:"evento"},{id:"1NrvZd3gB6CPMYi9ulLLLtVi4hvuTh8zt",cat:"evento"},
{id:"13-g8jaszvjyoBE-BebGNB6h5IpMBbQ84",cat:"evento"},{id:"142vukxIAT6wU3DALd6mQwX9RdNtMAS7A",cat:"evento"},
{id:"17HJ3gELBh7nqLziPUJqO5Tp69BU7x2LX",cat:"evento"},{id:"14oIdzD8HGU9X02QKTcOi7uQ7tV2S7K3z",cat:"evento"},
{id:"1Wi99SqLv-2RPnYNX1o29syMBYEA3qI5p",cat:"evento"},{id:"13cw0556OGo6KL75N7vYVw0ClvJvk4cbO",cat:"evento"},
{id:"1vnrUfiuLnmEhc0MfusO6uc0Ik3BkLsyr",cat:"evento"},{id:"1hZviqJkBlR-KtWBP_RQCcXHnw1eJJU6x",cat:"evento"}];

const gallery=document.getElementById("gallery"),loadStatus=document.getElementById("loadStatus"),photoCount=document.getElementById("photoCount");
const viewer=document.getElementById("viewer"),viewerImg=document.getElementById("viewerImg"),openOriginal=document.getElementById("openOriginal");
const thumb=(id,size=900)=>`https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
const original=id=>`https://drive.google.com/file/d/${id}/view`;

function render(filter="all"){
 gallery.innerHTML="";
 const list=photos.filter(p=>filter==="all"||p.cat===filter);
 list.forEach((p,i)=>{
  const card=document.createElement("article");card.className="photo-card";
  const img=document.createElement("img");img.loading="lazy";img.alt=`Foto ${i+1}`;img.src=thumb(p.id);
  const meta=document.createElement("div");meta.className="photo-meta";meta.innerHTML="<span>IMC PHOTOS</span><span>AMPLIAR ↗</span>";
  card.append(img,meta);card.onclick=()=>{viewerImg.src=thumb(p.id,1800);openOriginal.href=original(p.id);viewer.showModal()};gallery.appendChild(card);
 });
 photoCount.textContent=photos.length.toLocaleString("pt-BR");
 loadStatus.textContent=`${list.length} fotos carregadas nesta versão de teste`;
}
document.querySelectorAll(".filter").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));btn.classList.add("active");render(btn.dataset.filter)});
document.getElementById("closeViewer").onclick=()=>viewer.close();viewer.addEventListener("click",e=>{if(e.target===viewer)viewer.close()});

const findModal=document.getElementById("findModal"),input=document.getElementById("selfieInput"),previewWrap=document.getElementById("previewWrap"),preview=document.getElementById("selfiePreview"),searchButton=document.getElementById("searchFace"),faceStatus=document.getElementById("faceStatus");
document.querySelectorAll("[data-open-find]").forEach(el=>el.onclick=()=>findModal.showModal());
document.getElementById("closeFind").onclick=()=>findModal.close();
findModal.addEventListener("click",e=>{if(e.target===findModal)findModal.close()});
input.onchange=()=>{const file=input.files?.[0];if(!file)return;preview.src=URL.createObjectURL(file);previewWrap.hidden=false;faceStatus.hidden=true};

searchButton.onclick=async()=>{
 const file=input.files?.[0];if(!file)return;
 searchButton.disabled=true;searchButton.textContent="ANALISANDO...";
 faceStatus.hidden=false;faceStatus.className="face-status warn";faceStatus.textContent="Enviando selfie para o servidor...";
 try{
  const form=new FormData();form.append("file",file);
  const response=await fetch("/api/find-face",{method:"POST",body:form});
  const data=await response.json();
  if(!response.ok)throw new Error(data.detail||"Falha ao analisar a imagem.");
  if(data.faces===1){faceStatus.className="face-status ok";faceStatus.innerHTML="<strong>Rosto detectado com sucesso.</strong><br>O backend já está funcionando. A próxima etapa é comparar esse rosto com o índice das fotos do Drive."}
  else if(data.faces===0){faceStatus.className="face-status error";faceStatus.innerHTML="<strong>Nenhum rosto detectado.</strong><br>Tente outra selfie com o rosto mais visível."}
  else{faceStatus.className="face-status warn";faceStatus.innerHTML=`<strong>${data.faces} rostos detectados.</strong><br>Use uma imagem com somente uma pessoa.`}
 }catch(err){faceStatus.className="face-status error";faceStatus.innerHTML=`<strong>Erro no servidor.</strong><br>${err.message}`}
 finally{searchButton.disabled=false;searchButton.textContent="ANALISAR SELFIE"}
};

document.getElementById("menuBtn").onclick=()=>document.getElementById("nav").classList.toggle("open");
document.querySelectorAll("#nav a").forEach(a=>a.onclick=()=>document.getElementById("nav").classList.remove("open"));
render();