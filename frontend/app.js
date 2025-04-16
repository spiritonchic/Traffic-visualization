import * as THREE from 'https://esm.sh/three@0.152.2';
import {OrbitControls} from 'https://esm.sh/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import ThreeGlobe from 'https://esm.sh/three-globe@2.25.0';

const renderer = new THREE.WebGLRenderer({antialias: true, canvas: document.getElementById('globe-canvas')});
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 300;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true;

const globe = new ThreeGlobe()
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png');

scene.add(globe);

scene.add(new THREE.AmbientLight(0x888888));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(100, 100, 100);
scene.add(directionalLight);

const TTL = 10000;
const activePoints = [];

function createSphere(lat, lon, color) {
    const geometry = new THREE.SphereGeometry(1.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({color});
    const sphere = new THREE.Mesh(geometry, material);

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    sphere.position.set(
        100 * Math.sin(phi) * Math.cos(theta),
        100 * Math.cos(phi),
        100 * Math.sin(phi) * Math.sin(theta)
    );

    return sphere;
}

function updatePointsList() {
    const pointsListDiv = document.getElementById('points-list');
    pointsListDiv.innerHTML = '';

    const filterSuspicious = document.getElementById('filter-suspicious').checked;
    const now = Date.now();

    const filtered = activePoints
        .filter(p => (now - p.timestamp < TTL) && (!filterSuspicious || p.suspicious))
        .slice(-10);

    filtered.forEach(pt => {
        const div = document.createElement('div');
        div.classList.add('point');
        if (pt.suspicious) div.classList.add('suspicious');
        div.innerHTML = `Lat: ${pt.lat}, Lng: ${pt.lng}, Suspicious: ${pt.suspicious ? 'Yes' : 'No'}`;
        pointsListDiv.appendChild(div);
    });
}

function animate() {
    requestAnimationFrame(animate);

    const now = Date.now();

    for (let i = activePoints.length - 1; i >= 0; i--) {
        if (now - activePoints[i].timestamp > TTL) {
            scene.remove(activePoints[i].sphere);
            activePoints.splice(i, 1);
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.background = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.padding = '5px';
tooltip.style.display = 'none';
tooltip.style.pointerEvents = 'none';
document.body.appendChild(tooltip);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const spheres = activePoints.map(p => p.sphere);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        const pt = activePoints.find(p => p.sphere === obj);
        if (pt) {
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
            tooltip.innerHTML = `Lat: ${pt.lat}<br>Lng: ${pt.lng}<br>Suspicious: ${pt.suspicious ? 'Yes' : 'No'}`;
        }
    } else {
        tooltip.style.display = 'none';
    }
}

window.addEventListener('mousemove', onMouseMove);

setInterval(async () => {
    try {
        const res = await fetch('http://localhost:5000/data'); // Подставь свой путь
        const newPoints = await res.json();

        const now = Date.now();
        newPoints.forEach(p => {
            const lat = +p.lat;
            const lng = +p.lon;
            const suspicious = +p.suspicious;

            const color = suspicious ? 'red' : 'green';
            const sphere = createSphere(lat, lng, color);
            scene.add(sphere);

            activePoints.push({lat, lng, suspicious, timestamp: now, sphere});
        });

        updatePointsList();
    } catch (err) {
        console.error('Error fetching points:', err);
    }
}, 1000);

document.getElementById('filter-suspicious').addEventListener('change', updatePointsList);
