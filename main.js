import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 1. НАСТРОЙКА 3D СЦЕНЫ ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.05);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.target.set(0, 1, 0);

// --- 2. ОСВЕЩЕНИЕ ---
const ambientLight = new THREE.AmbientLight(0x222233, 1.5);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x6688ff, 1.5);
moonLight.position.set(5, 10, -5);
moonLight.castShadow = true;
scene.add(moonLight);

const fireLight = new THREE.PointLight(0xff7722, 2, 10);
fireLight.position.set(-3, 1, -2);
fireLight.castShadow = true;
scene.add(fireLight);

// --- 3. ОКРУЖЕНИЕ (КАБИНЕТ) ---
const floorGeo = new THREE.PlaneGeometry(20, 20);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
floor.receiveShadow = true;
scene.add(floor);

const deskGeo = new THREE.BoxGeometry(6, 0.2, 4);
const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 });
const desk = new THREE.Mesh(deskGeo, deskMat);
desk.position.y = 0;
desk.castShadow = true;
desk.receiveShadow = true;
scene.add(desk);

const gunGroup = new THREE.Group();
const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.6), gunMat);
const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.15), gunMat);
handle.position.set(0, -0.15, 0.2);
handle.rotation.x = -0.3;
gunGroup.add(barrel);
gunGroup.add(handle);
gunGroup.position.set(2, 0.15, -1);
gunGroup.rotation.y = -0.5;
gunGroup.castShadow = true;
scene.add(gunGroup);

const paperGeo = new THREE.PlaneGeometry(1.5, 1);
const paperMat = new THREE.MeshStandardMaterial({ color: 0xc4bca0, roughness: 1 });
const paper = new THREE.Mesh(paperGeo, paperMat);
paper.rotation.x = -Math.PI / 2;
paper.rotation.z = 0.2;
paper.position.set(-2, 0.11, 1);
paper.receiveShadow = true;
scene.add(paper);

// --- 4. ЗВУК ---
let ambientSound;
try {
    ambientSound = new Howl({
        src: ['sound.mp3'], // Если загрузите звук в репозиторий
        loop: true,
        volume: 0.5,
        onloaderror: () => console.log("Аудио не найдено.")
    });
} catch (e) { }

document.getElementById('volume').addEventListener('input', (e) => {
    if(ambientSound) ambientSound.volume(parseFloat(e.target.value));
});

document.body.addEventListener('click', () => {
    if(ambientSound && !ambientSound.playing()) ambientSound.play();
}, { once: true });

// --- 5. КНИГА ---
let pagesText = []; 
let currentPage = 0;

const bookGroup = new THREE.Group();
bookGroup.position.set(0, 0.1, 0);
bookGroup.rotation.x = -Math.PI / 2;
bookGroup.rotation.z = Math.PI / 6;
scene.add(bookGroup);

const coverGeo = new THREE.BoxGeometry(3.2, 4.2, 0.1);
const coverMat = new THREE.MeshStandardMaterial({ color: 0x331111, roughness: 0.8 });
const cover = new THREE.Mesh(coverGeo, coverMat);
cover.position.z = -0.05;
cover.castShadow = true;
bookGroup.add(cover);

// Функция создания текстуры из текста
function createPageTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f4ecd8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#222';
    ctx.font = '18px "Times New Roman", serif'; // Чуть уменьшил шрифт, чтобы влезало больше
    
    const paragraphs = text.split('\n');
    let y = 50;
    const maxWidth = 440;
    const lineHeight = 26;

    for(let p = 0; p < paragraphs.length; p++) {
        if(y > 980) break;
        
        const words = paragraphs[p].split(' ');
        let line = '';
        
        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, 36, y);
                line = words[n] + ' ';
                y += lineHeight;
                if(y > 980) break;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 36, y);
        y += lineHeight; // Отступ между абзацами
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
}

const leftPageGeo = new THREE.PlaneGeometry(1.5, 4);
const leftPageMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.9 });
const leftPage = new THREE.Mesh(leftPageGeo, leftPageMat);
leftPage.position.set(-0.75, 0, 0.05);
leftPage.receiveShadow = true;
bookGroup.add(leftPage);

const rightPageGroup = new THREE.Group();
rightPageGroup.position.set(0, 0, 0.06);
bookGroup.add(rightPageGroup);

const rightPageGeo = new THREE.PlaneGeometry(1.5, 4);
const rightPageMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.9, side: THREE.DoubleSide });
const rightPage = new THREE.Mesh(rightPageGeo, rightPageMat);
rightPage.position.set(0.75, 0, 0);
rightPage.castShadow = true;
rightPageGroup.add(rightPage);

// --- 6. ЗАГРУЗКА ТЕКСТА ИЗ BOOK.TXT ---
async function loadBookText() {
    try {
        const response = await fetch('book.txt');
        if(!response.ok) throw new Error("Файл не найден");
        
        const fullText = await response.text();
        
        // Разбиваем на страницы по 800 символов (чтобы влезало на 3D страницу)
        const chunkSize = 800; 
        for (let i = 0; i < fullText.length; i += chunkSize) {
            pagesText.push(fullText.substring(i, i + chunkSize));
        }
        
        updatePageVisuals();
    } catch (error) {
        console.error("Ошибка:", error);
        pagesText = ["Ошибка загрузки файла book.txt. Убедитесь, что он лежит в корне репозитория."];
        updatePageVisuals();
    }
}

function updatePageVisuals() {
    if(pagesText.length === 0) return;
    const currentText = pagesText[currentPage] || "Конец.";
    
    leftPageMat.map = createPageTexture(currentText.substring(0, Math.floor(currentText.length/2)));
    leftPageMat.needsUpdate = true;
    
    rightPageMat.map = createPageTexture(currentText.substring(Math.floor(currentText.length/2)));
    rightPageMat.needsUpdate = true;
}

// --- 7. ПЕРЕЛИСТЫВАНИЕ ---
let isFlipping = false;
let flipDirection = 1;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects([leftPage, rightPage]);
    
    if (intersects.length > 0 && !isFlipping) {
        if (intersects[0].object === rightPage) {
            flipDirection = 1;
            isFlipping = true;
        } else if (intersects[0].object === leftPage && currentPage > 0) {
            flipDirection = -1;
            isFlipping = true;
            currentPage--;
            updatePageVisuals();
            rightPageGroup.rotation.y = -Math.PI; 
        }
    }
});

// --- 8. ЦИКЛ РЕНДЕРИНГА ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    if (isFlipping) {
        rightPageGroup.rotation.y -= delta * 4 * flipDirection;
        
        if (flipDirection === 1 && rightPageGroup.rotation.y <= -Math.PI) {
            rightPageGroup.rotation.y = 0;
            isFlipping = false;
            if (currentPage < pagesText.length - 1) {
                currentPage++;
                updatePageVisuals();
            }
        } else if (flipDirection === -1 && rightPageGroup.rotation.y >= 0) {
            rightPageGroup.rotation.y = 0;
            isFlipping = false;
        }
    }
    
    fireLight.intensity = 2 + Math.sin(Date.now() * 0.01) * 0.3;
    
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

loadBookText();
animate();
