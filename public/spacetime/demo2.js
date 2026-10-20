var canvas = document.querySelector('#scene');
var width = (canvas && canvas.offsetWidth > 0) ? canvas.offsetWidth : (window.innerWidth || 300),
    height = (canvas && canvas.offsetHeight > 0) ? canvas.offsetHeight : (window.innerHeight || 150);

// STEP 0: Check URL query parameter & Tier Detection
var searchParams = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
var bgParam = searchParams ? searchParams.get('bg') : null;

var isCoarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
var isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;
var isLowCpu = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 6;
var isLowMem = typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;

var isLowTier = bgParam === 'low' || (window.__SPACETIME_TIER__ === 'low') || isCoarse || isNarrow || isLowCpu || isLowMem;
if (bgParam === 'desktop' || bgParam === 'high') {
    isLowTier = false;
}

// 5. Renderer settings:
// Low tier: antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', setPixelRatio(1)
// Desktop tier: antialias: true, max pixel ratio 1.5
var rendererOptions = isLowTier ? {
    canvas: canvas,
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power'
} : {
    canvas: canvas,
    antialias: true
};

var renderer = new THREE.WebGLRenderer(rendererOptions);
var desktopPixelRatio = Math.min(window.devicePixelRatio > 1 ? window.devicePixelRatio : 1, 1.5);
var pixelRatio = isLowTier ? 1 : desktopPixelRatio;
renderer.setPixelRatio(pixelRatio);
renderer.setSize(width, height);

// Determine initial theme mode from window.__currentSpacetimeTheme or HTML attribute
var initialMode = window.__currentSpacetimeTheme ||
    (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

// Theme color objects:
var clearColorObj = new THREE.Color(initialMode === "light" ? 0xffffff : 0x000000);
var dotColorObj = new THREE.Color(initialMode === "light" ? 0x000000 : 0xffffff);

renderer.setClearColor(clearColorObj);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
camera.position.set(0, 0, 80);

var loader = new THREE.TextureLoader();
loader.crossOrigin = "Anonymous";
var dotTexture = loader.load('/spacetime/dotTexture.png');

var radius = 50;

// 1. Fewer particles on low tier:
// detail 4 = 2,562 vertices (4x lighter than desktop 10,242, rich look without being sparse)
// desktop = detail 5 (10,242 points)
var detail = isLowTier ? 4 : 5;
var sphereGeom = new THREE.IcosahedronGeometry(radius, detail);
var dotsGeom = new THREE.Geometry();
var bufferDotsGeom = new THREE.BufferGeometry();
var positions = new Float32Array(sphereGeom.vertices.length * 3);
var initialPositions = new Float32Array(sphereGeom.vertices.length * 3);
var animDelays = new Float32Array(sphereGeom.vertices.length);

for (var i = 0; i < sphereGeom.vertices.length; i++) {
    var vector = sphereGeom.vertices[i];
    if (!isLowTier) {
        animateDot(i, vector);
        dotsGeom.vertices.push(vector);
    }
    vector.toArray(positions, i * 3);
    vector.toArray(initialPositions, i * 3);
    animDelays[i] = Math.abs(vector.y / radius) * 2;
}

function animateDot(index, vector) {
    TweenMax.to(vector, 4, {
        x: 0,
        z: 0,
        ease: Back.easeOut,
        delay: Math.abs(vector.y / radius) * 2,
        repeat: -1,
        yoyo: true,
        yoyoEase: Back.easeOut,
        onUpdate: function () {
            updateDot(index, vector);
        }
    });
}

function updateDot(index, vector) {
    positions[index * 3] = vector.x;
    positions[index * 3 + 2] = vector.z;
}

var attributePositions = new THREE.BufferAttribute(positions, 3);
bufferDotsGeom.addAttribute('position', attributePositions);
bufferDotsGeom.addAttribute('initialPosition', new THREE.BufferAttribute(initialPositions, 3));
bufferDotsGeom.addAttribute('animDelay', new THREE.BufferAttribute(animDelays, 1));

var pointSizeVal = isLowTier ? 3.2 : (3.0 * pixelRatio);

var shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        texture: {
            value: dotTexture
        },
        dotColor: {
            value: dotColorObj
        },
        uTime: {
            value: 0.0
        },
        uIsLowTier: {
            value: isLowTier ? 1.0 : 0.0
        },
        uPointSize: {
            value: pointSizeVal
        }
    },
    vertexShader: document.getElementById("wrapVertexShader").textContent,
    fragmentShader: document.getElementById("wrapFragmentShader").textContent,
    transparent: true
});

var dots = new THREE.Points(bufferDotsGeom, shaderMaterial);
scene.add(dots);

var isFirstThemeCall = true;

window.setSpacetimeTheme = function(mode) {
    window.__currentSpacetimeTheme = mode;
    var targetBg = mode === "light" ? new THREE.Color(0xffffff) : new THREE.Color(0x000000);
    var targetDot = mode === "light" ? new THREE.Color(0x000000) : new THREE.Color(0xffffff);

    if (isFirstThemeCall) {
        isFirstThemeCall = false;
        clearColorObj.copy(targetBg);
        dotColorObj.copy(targetDot);
        renderer.setClearColor(clearColorObj);
        return;
    }

    // Smooth 0.4s transition on theme toggle
    TweenMax.to(clearColorObj, 0.4, {
        r: targetBg.r,
        g: targetBg.g,
        b: targetBg.b,
        ease: Power1.easeOut,
        onUpdate: function() {
            renderer.setClearColor(clearColorObj);
        }
    });

    TweenMax.to(dotColorObj, 0.4, {
        r: targetDot.r,
        g: targetDot.g,
        b: targetDot.b,
        ease: Power1.easeOut
    });
};

// 4. Visibility pause & Reduced motion pause:
var isCanvasVisible = true;
if (typeof IntersectionObserver !== 'undefined' && canvas) {
    var canvasObserver = new IntersectionObserver(function(entries) {
        if (entries[0]) {
            isCanvasVisible = entries[0].isIntersecting;
        }
    }, { threshold: 0 });
    canvasObserver.observe(canvas);
}

var isReducedMotion = false;
if (typeof window !== 'undefined' && window.matchMedia) {
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion = motionQuery.matches;
    if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', function(e) {
            isReducedMotion = e.matches;
            if (isReducedMotion) {
                // Keep the current static frame
                renderer.render(scene, camera);
            }
        });
    }
}

// 2. Render driver (uncapped by default, runs every rAF tick; opt-in ?bg=cap30):
var startTime = performance.now();
var lastRenderTime = 0;
var isCap30 = bgParam === 'cap30' || (searchParams && searchParams.get('cap') === '30');
var frameInterval = 1000 / 30; // 33.33ms cap only when opt-in ?bg=cap30
var hasRenderedInitialFrame = false;

function render(a) {
    if (isLowTier) {
        if (isReducedMotion) {
            if (!hasRenderedInitialFrame) {
                hasRenderedInitialFrame = true;
                renderer.render(scene, camera);
            }
            return;
        }
        if (!isCanvasVisible || (typeof document !== 'undefined' && document.hidden)) {
            return;
        }
        var now = performance.now();
        if (isCap30) {
            if (now - lastRenderTime < frameInterval - 1) {
                return;
            }
            lastRenderTime = now;
        }

        // Update time uniform in vertex shader (0 CPU cost, 0 buffer re-upload)
        var timeSec = (now - startTime) * 0.001;
        shaderMaterial.uniforms.uTime.value = timeSec;
    } else {
        dots.geometry.verticesNeedUpdate = true;
        dots.geometry.attributes.position.needsUpdate = true;
    }

    hasRenderedInitialFrame = true;
    renderer.render(scene, camera);
}

// 7. Ignore resize noise:
var lastWidth = width;
var lastHeight = height;

function onResize() {
    var newWidth = (canvas && canvas.offsetWidth > 0) ? canvas.offsetWidth : (window.innerWidth || 300);
    var newHeight = (canvas && canvas.offsetHeight > 0) ? canvas.offsetHeight : (window.innerHeight || 150);

    if (isLowTier) {
        // Only resize when WIDTH changes, or height changes by > 150px
        if (newWidth === lastWidth && Math.abs(newHeight - lastHeight) <= 150) {
            return;
        }
    }

    lastWidth = newWidth;
    lastHeight = newHeight;
    width = newWidth;
    height = newHeight;

    canvas.style.width = '';
    canvas.style.height = '';
    camera.aspect = width / height;
    camera.updateProjectionMatrix();  
    renderer.setSize(width, height);
}

// 3. Interaction listeners:
// On low tier: touchmove tilt is removed entirely to prevent tween allocations during scroll.
// On desktop tier: mousemove tilt remains active.
var mouse = new THREE.Vector2(0.8, 0.5);

function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) - 0.5;
    mouse.y = (e.clientY / window.innerHeight) - 0.5;
    TweenMax.to(dots.rotation, 4, {
        x: (mouse.y * Math.PI * 0.5),
        z: (mouse.x * Math.PI * 0.2),
        ease: Power1.easeOut
    });
}

function onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
        mouse.x = (e.touches[0].clientX / window.innerWidth) - 0.5;
        mouse.y = (e.touches[0].clientY / window.innerHeight) - 0.5;
        TweenMax.to(dots.rotation, 4, {
            x: (mouse.y * Math.PI * 0.5),
            z: (mouse.x * Math.PI * 0.2),
            ease: Power1.easeOut
        });
    }
}

TweenMax.ticker.addEventListener("tick", render);

var isTouchDevice = ('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

if (!isLowTier) {
    if (!isTouchDevice) {
        window.addEventListener("mousemove", onMouseMove);
    } else {
        window.addEventListener("touchmove", onTouchMove, { passive: true });
    }
}

var resizeTm;
window.addEventListener("resize", function(){
    resizeTm = clearTimeout(resizeTm);
    resizeTm = setTimeout(onResize, 200);
});

// Clean-up hooks
window.render = render;
window.onMouseMove = onMouseMove;
window.onTouchMove = onTouchMove;
window.onResize = onResize;
window.resizeTm = resizeTm;
window.renderer = renderer;
