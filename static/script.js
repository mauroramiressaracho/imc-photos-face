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

function makeCard(p,i,score=null){
 const card=document.createElement("article");card.className="photo-card";
 const img=document.createElement("img");img.loading="lazy";img.alt=`Foto ${i+1}`;img.src=thumb(p.id);
 const meta=document.createElement("div");meta.className="photo-meta";
 const scoreText=score!==null?`${Math.round(score*100)}% similar`:"AMPLIAR ↗";
 meta.innerHTML=`<span>IMC PHOTOS</span><span>${scoreText}</span>`;
 card.append(img,meta);
 card.onclick=()=>{viewerImg.src=thumb(p.id,1800);openOriginal.href=original(p.id);viewer.showModal()};
 return card;
}

function render(filter="all"){
 gallery.innerHTML="";
 const list=photos.filter(p=>filter==="all"||p.cat===filter);
 list.forEach((p,i)=>gallery.appendChild(makeCard(p,i)));
 photoCount.textContent=photos.length.toLocaleString("pt-BR");
 loadStatus.textContent=`${list.length} fotos carregadas nesta versão de teste`;
}

function renderMatches(matches){
 gallery.innerHTML="";
 const byId=new Map(photos.map(p=>[p.id,p]));
 const valid=matches.map(m=>({match:m,photo:byId.get(m.id)})).filter(x=>x.photo);
 valid.forEach((item,i)=>gallery.appendChild(makeCard(item.photo,i,item.match.score)));
 loadStatus.textContent=valid.length
   ? `${valid.length} foto(s) encontrada(s) pela busca facial. Clique em uma foto para ampliar.`
   : "Nenhuma foto compatível foi encontrada neste álbum de teste.";
 document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
 document.getElementById("album").scrollIntoView({behavior:"smooth",block:"start"});
}

document.querySelectorAll(".filter").forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
 btn.classList.add("active");
 render(btn.dataset.filter)
});
document.getElementById("closeViewer").onclick=()=>viewer.close();viewer.addEventListener("click",e=>{if(e.target===viewer)viewer.close()});

const findModal=document.getElementById("findModal"),input=document.getElementById("selfieInput"),previewWrap=document.getElementById("previewWrap"),preview=document.getElementById("selfiePreview"),searchButton=document.getElementById("searchFace"),faceStatus=document.getElementById("faceStatus");
document.querySelectorAll("[data-open-find]").forEach(el=>el.onclick=()=>findModal.showModal());
document.getElementById("closeFind").onclick=()=>findModal.close();
findModal.addEventListener("click",e=>{if(e.target===findModal)findModal.close()});
input.onchange=()=>{const file=input.files?.[0];if(!file)return;preview.src=URL.createObjectURL(file);previewWrap.hidden=false;faceStatus.hidden=true};

searchButton.onclick=async()=>{
 const file=input.files?.[0];if(!file)return;
 searchButton.disabled=true;searchButton.textContent="PROCURANDO...";
 faceStatus.hidden=false;faceStatus.className="face-status warn";
 faceStatus.innerHTML="<strong>Analisando seu rosto...</strong><br>No primeiro uso o servidor também prepara o índice das fotos; pode demorar um pouco.";
 try{
  const form=new FormData();form.append("file",file);
  const response=await fetch("/api/find-face",{method:"POST",body:form});
  const data=await response.json();
  if(!response.ok)throw new Error(data.detail||"Falha ao analisar a imagem.");

  if(data.faces_detected===0){
   faceStatus.className="face-status error";
   faceStatus.innerHTML="<strong>Nenhum rosto detectado.</strong><br>Tente outra selfie com o rosto mais visível.";
   return;
  }

  faceStatus.className=data.count>0?"face-status ok":"face-status warn";
  faceStatus.innerHTML=data.count>0
   ? `<strong>${data.count} foto(s) encontrada(s).</strong><br>Usamos o rosto principal da selfie e encontramos ${data.count} resultado(s) acima do limite de similaridade.`
   : "<strong>Nenhuma foto encontrada.</strong><br>O rosto foi detectado, mas não houve correspondência suficiente neste álbum de teste.";

  renderMatches(data.matches||[]);
  if(data.count>0){
    setTimeout(()=>findModal.close(),700);
  }
 }catch(err){
  faceStatus.className="face-status error";
  faceStatus.innerHTML=`<strong>Erro no servidor.</strong><br>${err.message}`;
 }finally{
  searchButton.disabled=false;
  searchButton.textContent="PROCURAR MINHAS FOTOS";
 }
};

document.getElementById("menuBtn").onclick=()=>document.getElementById("nav").classList.toggle("open");
document.querySelectorAll("#nav a").forEach(a=>a.onclick=()=>document.getElementById("nav").classList.remove("open"));
render();