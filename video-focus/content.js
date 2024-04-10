// Copyright (c) 2024 LazyEdward
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
try{
	console.log("successfully runs content script");

	// const currentTime = Date.now();

	// https://justadudewhohacks.github.io/face-api.js/docs/index.html#models-face-recognition
	// ~ must be divisible by 32, common sizes are 128, 160, 224, 320, 416, 512, 608,
	// const inputSize = 224;
	// const scoreThreshold = 0.5;

	// let isDetectorFocus = false;

	let currentLocation = ''

	let switchInteract = false
	let interact = false
	let isFullscreen = false
	let isVisible = false

	let paused = false;
	let autoPlay = false;
	let autoPauseOnFullScreenChange = true;
	let autoPauseOnSwitchTab = true;
	let autoResume = true;
	let activateListener = false;
	let enableFaceTrackng = false;
	let enableFaceTrackngFullScreenOnly = true;
	let faceDetectionFocus = false;

	const checkIsWebCamOn = async() => {
		let devices = await navigator.mediaDevices.enumerateDevices();

		for(let device of devices){
			if(!!device.deviceId)
				return true;
		}

		return false;
	}

	const frameListener = (focusOnOffFullscreenVideo, focusOnOffVideo, searchVideos, searchFullscreenVideos) => {
		if(paused){
			setTimeout(() => frameListener(focusOnOffFullscreenVideo, focusOnOffVideo, searchVideos, searchFullscreenVideos));
			return;
		}

		if(!autoPlay){
			if(currentLocation !== window.location.href){
				interact = false;
				currentLocation = window.location.href;
				setTimeout(() => frameListener(focusOnOffFullscreenVideo, focusOnOffVideo, searchVideos, searchFullscreenVideos));
				return;
			}
	
			if(!interact){
				focusOnOffVideo(false);
				setTimeout(() => frameListener(focusOnOffFullscreenVideo, focusOnOffVideo, searchVideos, searchFullscreenVideos));
				return;
			}
		}

		let activate = true;

		// Pause videos on tab focuses
		if(autoPauseOnSwitchTab && !isVisible)
			activate = false;
	
		// Pause videos on exit fullscreen
		if(autoPauseOnFullScreenChange && !isFullscreen)
			activate = false;

		if(activateListener !== activate){
			if(!activate)
				focusOnOffVideo(false)

			if(autoPauseOnFullScreenChange && isFullscreen)
				focusOnOffFullscreenVideo(true)

			activateListener = activate;
			switchInteract = false;
		}
		else if(autoPauseOnSwitchTab && !isVisible){
			focusOnOffVideo(false)
			switchInteract = false;
		}
		else if(enableFaceTrackng){
			let shouldTrack = !enableFaceTrackngFullScreenOnly || isFullscreen

			if(shouldTrack){

				if(faceDetectionFocus){

					if(autoResume && switchInteract){
						if(!isFullscreen)
							focusOnOffVideo(true)
						else
							focusOnOffFullscreenVideo(true)
					}
				}
				else{
					if(!isFullscreen)
						focusOnOffVideo(false)
					else
						focusOnOffFullscreenVideo(false)
				}
			}
		}

		setTimeout(() => frameListener(focusOnOffFullscreenVideo, focusOnOffVideo));
	}

	const loadAndRunController = async() => {
		
		let webCamOn = await checkIsWebCamOn();

		if(webCamOn){
			console.log("This page is streaming, not valid for video focus action");
			return;
		}

		console.log("Load controller.js...")
		const controller = chrome.runtime.getURL('lib/controller.js');

		if(!controller){
			console.log("Failed to load controller.js")
			alert("Failed to load controller.js")
			return;
		}

		const { focusOnOffFullscreenVideo, focusOnOffVideo, searchVideos, searchFullscreenVideos } = await import(controller);
		console.log("Load controller.js successfully")

		// https://github.com/GoogleChrome/chrome-extensions-samples/issues/821#issuecomment-1680300556
		// const hiddenTrackerPage = chrome.runtime.getURL("tracker.html");

		// const iframe = document.createElement("iframe");
		// iframe.setAttribute("hidden", "hidden");
		// iframe.setAttribute("id", "permissionsIFrame");
		// iframe.setAttribute("allow", "camera");
		// iframe.src = hiddenTrackerPage;
		// document.body.appendChild(iframe);
		// console.log("Inject tracker.js successfully")

		// check user interaction
		document.addEventListener('mousedown', () => {
			interact = true
			switchInteract = true
		})

		// check user interaction
		document.addEventListener('keydown', () => {
			interact = true
			switchInteract = true
		})
	
		document.addEventListener('fullscreenchange', () => {
			isFullscreen = !!document.fullscreenElement
		})

		document.addEventListener('visibilitychange', () => {
			isVisible = document.visibilityState !== "hidden"
		})

		// listen to settings and tracking informations
		chrome.storage.onChanged.addListener((changes, area) => {
			autoPlay = changes?.['video-focus.paused'] ? changes?.['video-focus.paused'].newValue : autoPlay;
			paused = changes?.['video-focus.paused'] ? changes?.['video-focus.paused'].newValue : paused;
			enableFaceTrackng = changes?.['video-focus.enableFaceTrackng'] ? changes?.['video-focus.enableFaceTrackng'].newValue : enableFaceTrackng;
			enableFaceTrackngFullScreenOnly = changes?.['video-focus.enableFaceTrackngFullScreenOnly'] ? changes?.['video-focus.enableFaceTrackngFullScreenOnly'].newValue : enableFaceTrackngFullScreenOnly;
			autoPauseOnFullScreenChange = changes?.['video-focus.autoPauseOnFullScreenChange'] ? changes?.['video-focus.autoPauseOnFullScreenChange'].newValue : autoPauseOnFullScreenChange;
			autoPauseOnSwitchTab = changes?.['video-focus.autoPauseOnSwitchTab'] ? changes?.['video-focus.autoPauseOnSwitchTab']?.newValue : autoPauseOnSwitchTab;
			autoResume = changes?.['video-focus.autoResume'] ? changes?.['video-focus.autoResume'].newValue : autoResume;
	
			// if(!paused)
			// 	return;

			// if(autoPauseOnSwitchTab && document.visibilityState === "hidden")
			// 	return;
			
			// if(autoPauseOnFullScreenChange && !document.fullscreenElement)
			// 	return;
			
			if(changes["video-focus.faceDetectionFocus"] !== undefined){
				faceDetectionFocus = !!changes["video-focus.faceDetectionFocus"].newValue
			}
		
		});

		isVisible = document.visibilityState !== "hidden"
		isFullscreen = !!document.fullscreenElement

		frameListener(focusOnOffFullscreenVideo, focusOnOffVideo, searchVideos, searchFullscreenVideos)
	}

	chrome.storage.local.get([
		'video-focus.paused',
		'video-focus.enableFaceTrackng',
		'video-focus.enableFaceTrackngFullScreenOnly',
		'video-focus.autoPlay',
		'video-focus.autoPauseOnFullScreenChange',
		'video-focus.autoPauseOnSwitchTab',
		'video-focus.autoResume',
	]).then(async(storage) => {
		console.log(storage)
		autoPlay = storage?.['video-focus.autoPlay'] ?? false;
		paused = storage?.['video-focus.paused'] ?? false;
		enableFaceTrackng = storage?.['video-focus.enableFaceTrackng'] ?? false;
		enableFaceTrackngFullScreenOnly = storage?.['video-focus.enableFaceTrackngFullScreenOnly'] ?? true;
		autoPauseOnFullScreenChange = storage?.['video-focus.autoPauseOnFullScreenChange'] ?? false;
		autoPauseOnSwitchTab = storage?.['video-focus.autoPauseOnSwitchTab'] ?? false;
		autoResume = storage?.['video-focus.autoResume'] ?? false;

		await loadAndRunController();
	})

}
catch(e){
	console.log('script already exist')
}