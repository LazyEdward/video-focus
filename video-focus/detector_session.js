// Copyright (c) 2024 LazyEdward
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// Refer to how to use external library (downloaded) from content script
// https://github.com/GoogleChrome/chrome-extensions-samples/issues/706
// Setup of web_accessible_resources in manifest
// https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/web-accessible-resources

// https://justadudewhohacks.github.io/face-api.js/docs/index.html#models-face-recognition
// ~ must be divisible by 32, common sizes are 128, 160, 224, 320, 416, 512, 608,
console.log('run detector')

let init = false;
let activeDetection = -1;

let isFocus = null;
let stream = null;

let defaultDetector = "tiny_face"

let inputSize = 224;
let scoreThreshold = 0.5;
let minConfidence = 0.5;

let showDebugInfo = false;

let debugStatus = null
let videoEle = null;
let canvas = null;
let eleInactiveWarning = null;

const initFetchSetting = () => {
	chrome.runtime.sendMessage({
		type: 'fetchSetting',
		target: 'video-focus.fetchSetting',
		data: ''
	});
}

const keepAlivePing = () => {
	
	chrome.runtime.sendMessage({
		type: 'keepAlivePing',
		target: 'video-focus.keepAlivePing',
		data: ''
	});

	setTimeout(() => keepAlivePing(), 30000);
}

const detectFocus = async(update) => {

	if(!init || !stream || !videoEle || videoEle.paused || videoEle.ended){
		if(activeDetection)
			clearTimeout(activeDetection)
		activeDetection = setTimeout(async() => await detectFocus(update))
		return;
	}

	try{
		// FaceDetectionOptions - refer to https://justadudewhohacks.github.io/face-api.js/docs/index.html#tutorials
		// & https://justadudewhohacks.github.io/face-api.js/docs/globals.html#facedetectionoptions
		// console.log(`detectSingleFace start: ${Date.now()}`);

		const result = await faceapi.detectSingleFace(
			videoEle, 
			defaultDetector === "tiny_face" ? 
				new faceapi.TinyFaceDetectorOptions({inputSize, scoreThreshold})
			: new faceapi.SsdMobilenetv1Options({minConfidence})
		)

		if(isFocus !== !!result){
			// console.log(result);

			// if(!!result){
			// 	availableShotData = {
			// 		x: result._box._x,
			// 		y: result._box._y,
			// 		width: result._box._width,
			// 		height: result._box._height,
			// 	}
			// }

			// // update the chrome storage
			update(!!result)
			// console.log(`stateChange: ${!!result}`)'
			if(document.visibilityState !== "hidden" && debugStatus)
				debugStatus.style.backgroundColor = !!result ? '#2cc321' : '#d72929'
		}

		if (document.visibilityState !== "hidden" && result) {
			const dims = faceapi.matchDimensions(canvas, videoEle, true)
			faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims))
		}

		isFocus = !!result;
	}
	catch(e){
		console.log(e)
	}
	finally{
		if(activeDetection)
			clearTimeout(activeDetection)

		activeDetection = setTimeout(async() => await detectFocus(update));
	}
}

const createDebugContainer = () => {
	if(!videoEle)
		videoEle = document.getElementById('webcam_face_tracker');

	if(!!videoEle)
		videoEle.srcObject = stream;

	if(!canvas)
		canvas = document.getElementById('webcam_face_canvas');
	
	if(!debugStatus)
		debugStatus = document.getElementById('detection_status')

	updateDebugContainer()
}

const updateDebugContainer = () => {
	let eleDefaultDetector = document.getElementById('default_detector_value');
	let eleInputSize = document.getElementById('input_size_value');
	let eleScoreThreshold = document.getElementById('score_threshold_value');
	let eleMinConfidence = document.getElementById('min_confidence_value');

	if(eleDefaultDetector)
		eleDefaultDetector.textContent = (defaultDetector === "tiny_face" ? "Tiny Face" : "SSD Mobilenet")
	
	if(eleInputSize)
		eleInputSize.textContent = inputSize
	
	if(eleScoreThreshold)
		eleScoreThreshold.textContent = scoreThreshold
	
	if(eleMinConfidence)
		eleMinConfidence.textContent = minConfidence

	if(defaultDetector === "tiny_face"){
		eleInputSize.parentElement.style.display = 'flex'
		eleScoreThreshold.parentElement.style.display = 'flex'

		eleMinConfidence.parentElement.style.display = 'none'
	}
	else{
		eleInputSize.parentElement.style.display = 'none'
		eleScoreThreshold.parentElement.style.display = 'none'
	
		eleMinConfidence.parentElement.style.display = 'flex'
	}
}

const askWebcamPermission = async() => {
  try {
		stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

		if(!stream)
			throw Error()

		console.log('Webcam permission is given')
		// console.log(stream)
    /* use the stream */

		if(!eleInactiveWarning){
			eleInactiveWarning = document.getElementById('webcam_face_tracker_inactive');
		}

		eleInactiveWarning.style.display = 'none'

  } catch (err) {
    /* handle the error */
		// alert('Webcam permission is not given')
		if(!eleInactiveWarning){
			eleInactiveWarning = document.getElementById('webcam_face_tracker_inactive');
		}

		eleInactiveWarning.style.display = 'block'
		
		console.log('Webcam permission is not given')
		console.log(err)
  }
}

const startUp = async(data) => {
	console.log('On start up')
	if(init)
		return;

	defaultDetector = data['video-focus.defaultDetector'];
	inputSize = data['video-focus.inputSize'];
	scoreThreshold = data['video-focus.scoreThreshold'];
	minConfidence = data['video-focus.minConfidence'];

	init = true
	
	if(!stream)
		await askWebcamPermission()

	createDebugContainer();

	if(activeDetection)
		clearTimeout(activeDetection)

	activeDetection = detectFocus((result) => {

		chrome.runtime.sendMessage({
			type: 'faceDetectionFocus',
			target: 'video-focus.faceDetectionFocus',
			data: result
		});

	});	
	console.log(videoEle)
}

const update = async(data) => {
	if(init)
		return;

	defaultDetector = data['video-focus.defaultDetector'];
	inputSize = data['video-focus.inputSize'];
	scoreThreshold = data['video-focus.scoreThreshold'];
	minConfidence = data['video-focus.minConfidence'];

	updateDebugContainer()

	if(activeDetection)
		clearTimeout(activeDetection)

	activeDetection = detectFocus((result) => {

		chrome.runtime.sendMessage({
			type: 'faceDetectionFocus',
			target: 'video-focus.faceDetectionFocus',
			data: result
		});

	});	
}

const cleanUp = async() => {
	console.log('On clean up')
	if(activeDetection)
		clearTimeout(activeDetection)

	if(!eleInactiveWarning){
		eleInactiveWarning = document.getElementById('webcam_face_tracker_inactive');
	}

	eleInactiveWarning.style.display = 'block'

	if(canvas){
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	init = false
	if(stream){
		let stoppingStream = new Promise((resolve) => {
			stream.getVideoTracks()[0].stop();
			stream.removeTrack(stream.getVideoTracks()[0])

			videoEle.srcObject = null
			stream = null
		}).then(() => resolve())

		await stoppingStream;
	}
}

const loadFocusDetection = async() => {
	console.log("Loading faceapi.min.js...")
	const faceAPI = chrome.runtime.getURL('lib/face-api.min.js');

	if(!faceAPI){
		console.log("Failed to load faceapi.min.js")
		alert("Failed to load faceapi.min.js")
		return;
	}

	await import(faceAPI);
	console.log("Load faceapi.min.js successfully")

	console.log("Load faceapi model link...")

	let tinyFacemodelLink = chrome.runtime.getURL('lib/tiny_face_detector_model.weights');
	let ssdMobilemodelLink = chrome.runtime.getURL('lib/ssd_mobilenetv1.weights');

	if(!tinyFacemodelLink || !ssdMobilemodelLink){
		console.log("Failed to faceapi model link")
		return;
	}

	// https://github.com/justadudewhohacks/face-api.js/issues/153 - load model in content script
	await faceapi.nets.tinyFaceDetector.load(await faceapi.fetchNetWeights(tinyFacemodelLink));

	if(!faceapi.nets.tinyFaceDetector.params){
		console.log("Failed to faceapi model link")
		return
	}
	
	await faceapi.nets.ssdMobilenetv1.load(await faceapi.fetchNetWeights(ssdMobilemodelLink));
	
	if(!faceapi.nets.ssdMobilenetv1.params){
		console.log("Failed to faceapi model link")
		return
	}


	chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
		try{
			if (chrome.runtime.lastError)
				throw Error('chrome.runtime.lastError');
				
			console.log(req)

			if(req.target === "video-focus.initSettings" || req.target === "video-focus.updateSettings"){
				let data = JSON.parse(req.data);

				if(init){
					if(data['video-focus.paused'] || !data['video-focus.enableFaceTrackng']){
						cleanUp()
					}
					else{
						update(JSON.parse(req.data))
					}
				}
				else{
					if(!data['video-focus.paused'] && data['video-focus.enableFaceTrackng']){
						startUp(JSON.parse(req.data))
					}
				}
			}

		}
		catch(e){
			console.log(e)
		}
	});
	
	initFetchSetting();
	keepAlivePing();
}

loadFocusDetection();