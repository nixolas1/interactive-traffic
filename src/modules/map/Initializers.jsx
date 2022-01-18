import global from "./helpers/Global";
import * as THREE from "three";
import {MapControls} from "three/examples/js/controls/MapControls";
import {initializeJourneyData, updateIntersection} from "./Updaters";
import vertexShader from "./shaders/points.vert";
import fragmentShader from "./shaders/points.frag";
import ky from "ky";
// import lzutf8 from "lzutf8";

import {AfterimagePass} from 'three/examples/js/postprocessing/AfterimagePass'
import {UnrealBloomPass} from 'three/examples/js/postprocessing/UnrealBloomPass'
import {EffectComposer} from 'three/examples/js/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/js/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/js/postprocessing/ShaderPass'
import {AfterimageShader} from 'three/examples/js/shaders/AfterimageShader'
import {LuminosityHighPassShader} from 'three/examples/js/shaders/LuminosityHighPassShader'
import {CopyShader} from 'three/examples/js/shaders/CopyShader'
import {FXAAShader} from 'three/examples/js/shaders/FXAAShader'

export const initThree = (mount) => {
    const height = mount.clientHeight,
          width = mount.clientWidth

    //ADD RENDERER
    global.renderer = new THREE.WebGLRenderer({antialias: true})
    global.renderer.setClearColor(global.options.scene.bg)
    global.renderer.setPixelRatio(window.devicePixelRatio);
    global.renderer.setSize(width, height)

    //ADD SCENE
    global.scene = new THREE.Scene()
    global.scene.fog = new THREE.FogExp2(0x000000, global.options.scene.fog);

    //ADD CAMERA
    initCamera(height, width);

    // POST PROCESSING
    initEffects(height, width)

    // MAP
    initMapBg();

    // LINE INFO ON CLICK
    initLineDebug()

    global.timeElement = document.getElementById("time");
    global.debugElement = document.getElementById("error");

    return global.renderer;
}

const initCamera = (height, width) => {
    global.camera = new THREE.PerspectiveCamera(
        global.options.camera.fov,
        width / height,
        global.options.camera.near,
        global.options.camera.far
    )

    global.camera.position.set(0, 0, global.options.camera.z);

    let controls = new MapControls(global.camera, global.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.5;
    controls.screenSpacePanning = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 1000;
    controls.minPolarAngle = Math.PI / 2;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.5;
    // controls.panSpeed = 1.5;
    global.controls = controls;
}

const initEffects = (height, width) => {
    const hash = window.location.hash.substr(1);
    const effectType = hash ? parseInt(hash) : 0;

    if(effectType > 0) {
        global.composer = new EffectComposer(global.renderer);
        const renderPass = new RenderPass(global.scene, global.camera);
        renderPass.renderToScreen = false;
        global.composer.addPass(renderPass);
    }

    // Bloom
    if(effectType === 1 || effectType === 12) {
        global.renderer.toneMapping = THREE.ReinhardToneMapping;
        const params = {exposure: 1, bloomStrength: 1.5, bloomThreshold: 0, bloomRadius: 0};
        let bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        bloomPass.renderToScreen = true;
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;
        global.composer.addPass(bloomPass);
    }

    // Afterimage
    else if(effectType === 2 || effectType === 12) {
        let afterimagePass = new AfterimagePass(0.98);
        afterimagePass.renderToScreen = true;
        global.composer.addPass( afterimagePass );
    }


    // Antialias
    else if(effectType === 3) {
        let effectFXAA = new ShaderPass(FXAAShader);
        const pixelRatio = global.renderer.getPixelRatio();
        effectFXAA.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
        effectFXAA.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio)
        effectFXAA.renderToScreen = true;
        global.composer.addPass(effectFXAA);
    }
}

const initMapBg = () => {
    global.mapImg = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(global.options.scene.bgImg)});
    global.mapImg.map.needsUpdate = true;

    global.plane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), global.mapImg);
    global.plane.overdraw = true;
    global.scene.add(global.plane);
}

const initLineDebug = () => {
    global.raycaster = new THREE.Raycaster();
    global.raycaster.linePrecision = 3;
    document.addEventListener('mousedown', () => updateIntersection(false), false);
    document.addEventListener('mouseup', () => updateIntersection(true), false);
}

// set up geometries for particles. set arrays for the max limit of particles at init, so new particles arent created underway.
export const initGeometries = () => {
    global.sprite = new THREE.TextureLoader().load(global.options.points.sprite);

    let shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {texture: {value: global.sprite}},
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
    });

    global.geometry = new THREE.BufferGeometry()

    // up this if you are going to have many points
    const len = global.options.points.maxCount;

    // init empty particle attribute arrays
    // new custom props need to be added to the points shader to have effect
    global.geometry.addAttribute('position', new THREE.Float32BufferAttribute(new Array(len * 3).fill(0), 3).setDynamic(true));
    global.geometry.addAttribute('color', new THREE.Float32BufferAttribute(new Array(len * 3).fill(255), 3).setDynamic(true));
    global.geometry.addAttribute('size', new THREE.Float32BufferAttribute(new Array(len).fill(global.options.points.size), 1).setDynamic(true));
    global.geometry.addAttribute('visible', new THREE.Float32BufferAttribute(new Array(len).fill(0), 1).setDynamic(true));

    global.particles = new THREE.Points(global.geometry, shaderMaterial);
    global.particles.renderOrder = 1; // makes particles rendered last / on top
    global.particles.frustumCulled = false;
    global.scene.add(global.particles);

    // create easily accessible global variables
    global.pPositions = global.geometry.getAttribute("position").array;
    global.pColors = global.geometry.getAttribute("color").array;
    global.pSizes = global.geometry.getAttribute("size").array;
    global.pVisibility = global.geometry.getAttribute("visible").array;

    // make global accessible on window
    window.global = global;
}

export const getData = (callback) => {
    (async () => {
        try {
            const source = global.options.source
            const hash = window.location.hash.substr(1);
            const param = hash === "all" ? "?agency=" + hash : "";
            global.stops = await ky.get(source.baseUrl + source.stopUrl + param, {timeout: 70000}).json();
            global.journeyData = await ky.get(source.baseUrl + source.journeyUrl + param, {timeout: 70000}).json();

            global.renderer.domElement.classList.add("fadein")

            try {
                // cache response
                // localStorage.setItem("stops", JSON.stringify(global.stops))
                // lzutf8.compressAsync(JSON.stringify(global.journeyData), {outputEncoding: "Base64"}, (result) => {
                //     localStorage.setItem("journeys", result)
                // })
            } catch (e) {
                console.error("Could not store journey cache", e)
            }
        } catch (e) {
            console.error("Failed to download new journeys", e)

            // fetch cached
            // global.stops = JSON.parse(localStorage.getItem("stops"))
            // global.journeyData = JSON.parse(lzutf8.decompress(localStorage.getItem("journeys"), {inputEncoding: "Base64"}))
        }

        document.getElementById("loading").remove()

        // calculate points and add particles
        initializeJourneyData(global.journeyData, true, false);

        callback()
        return true;
    })();
}
