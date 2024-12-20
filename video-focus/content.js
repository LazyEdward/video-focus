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
	let initInteract = false
	let isFullscreen = false
	let isVisible = false

	let existingVideos = null;

	let paused = false;
	let tabPauseMapping = {}
	let autoPlay = false;
	let autoPauseOnFullScreenChange = true;
	let autoPauseOnSwitchTab = true;
	let autoResume = true;
	let activateListener = false;
	let enableFaceTrackng = false;
	let enableFaceTrackngFullScreenOnly = true;
	let faceDetectionFocus = false;

	const searchVideos = () => {
		return document.getElementsByTagName('video') ?? []
	}
	
	const searchFullscreenVideos = () => {
		return document.fullscreenElement?.getElementsByTagName('video') ?? []
	}
	
	const playOrResumeVideoElement = (video, focused) => {
		if(!video.getAttribute("muted"))
			video.setAttribute("muted", "false");
	
		if(video.ended)
			return;
	
		try{
			if(focused){
				if(video.paused)
					video.play()
			}
			else if(!video.paused)
				video.pause()
		}
		catch(e){
			console.log(e)
		}
	}
	
	// const focusOnOffFullscreenVideo = (focused) => {
	// 	if(!document.fullscreenElement){
	// 		for(const video of existingVideos)
	// 			playOrResumeVideoElement(video, false)
	// 			existingVideos = [];
	// 		return;
	// 	}
	
	// 	if(!videos || videos.length < 1)
	// 		videos = searchFullscreenVideos();
	
	// 	for(const video of videos)
	// 		playOrResumeVideoElement(video, focused)
	// }
	
	const focusOnOffVideo = (focused) => {
		for(const video of existingVideos)
			playOrResumeVideoElement(video, focused)
	}
	
	const pageInit = (trackable) => {
		if(chrome.runtime.id == undefined) return;

		let trackingAvailable = { "video-focus.trackingAvailable": trackable }
		let activeTab = { }

		if(isVisible && !!window.tabId){
			activeTab = { "video-focus.activeTab": window.tabId }
		}

		chrome.storage.local.set({...trackingAvailable, ...activeTab})
	}
	
	// const setIsTrackable = (trackable) => {
	// 	if(chrome.runtime.id == undefined) return;
		
	// 	chrome.storage.local.set({ "video-focus.trackingAvailable": trackable });
	// }

	// const setVisibleActive = () => {
	// 	if(!isVisible || !window.tabId) return;
	// 	if(chrome.runtime.id == undefined) return;
		
	// 	chrome.storage.local.set({ "video-focus.activeTab": window.tabId });
	// }

	const checkIsWebCamOn = async() => {
		let devices = await navigator.mediaDevices.enumerateDevices();

		for(let device of devices){
			if(!!device.deviceId && (device.kind === "videoinput"))
				return true;
		}

		return false;
	}

	const frameListener = () => {
		if(paused){
			setTimeout(() => frameListener());
			return;
		}

		if(!!tabPauseMapping && !!window.tabId && !!tabPauseMapping[window.tabId]){
			setTimeout(() => frameListener());
			return;
		}

		if(!autoPlay){
			if(currentLocation !== window.location.href){
				initInteract = false;
				// existingVideos = searchVideos();
				// setIsTrackable(existingVideos.length > 0)
				currentLocation = window.location.href;
				setTimeout(() => frameListener());
				return;
			}
	
			if(!initInteract){
				focusOnOffVideo(false);
				setTimeout(() => frameListener());
				return;
			}
		}
		else{
			if(currentLocation !== window.location.href){
				// existingVideos = searchVideos();
				// setIsTrackable(existingVideos.length > 0)
				currentLocation = window.location.href;
			}
		}

		if(existingVideos < 1){
			setTimeout(() => frameListener());
			return;
		}

		let activate = true;

		// Pause videos on tab focuses
		if(autoPauseOnSwitchTab && !isVisible)
			activate = false;
	
		// Pause videos on exit fullscreen
		if(autoPauseOnFullScreenChange && !isFullscreen)
			activate = false;

		if(activateListener !== activate){
			if(!activate){
				focusOnOffVideo(false)
				faceDetectionFocus = false
			}
			else if(!enableFaceTrackng){
				if((autoPauseOnFullScreenChange && isFullscreen) || (isVisible && autoPlay)){
					focusOnOffVideo(true)
					faceDetectionFocus = true
				}
			}

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

					if(autoResume){
						focusOnOffVideo(true)
						// if(!isFullscreen)
						// 	focusOnOffVideo(true)
						// else
						// 	focusOnOffFullscreenVideo(true)
					}
				}
				else{
					focusOnOffVideo(false)
					// if(!isFullscreen)
					// 	focusOnOffVideo(false)
					// else
					// 	focusOnOffFullscreenVideo(false)
				}
			}
		}

		setTimeout(() => frameListener());
	}

	const loadAndRunController = async() => {
		
		let webCamOn = await checkIsWebCamOn();

		if(webCamOn){
			console.log("This page is streaming, not valid for video focus action");
			pageInit(false)
			return;
		}

		isVisible = document.visibilityState !== "hidden"
		isFullscreen = !!document.fullscreenElement

		existingVideos = searchVideos();
		pageInit(true)

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
			initInteract = true
			switchInteract = true
		})

		// check user interaction
		document.addEventListener('keydown', () => {
			initInteract = true
			switchInteract = true
		})
	
		document.addEventListener('fullscreenchange', () => {
			isFullscreen = !!document.fullscreenElement
		})

		document.addEventListener('visibilitychange', () => {
			isVisible = document.visibilityState !== "hidden"
			if(isVisible)
				pageInit(true)
			else
				isFullscreen = false
		})

		// listen to settings and tracking informations
		chrome.storage.onChanged.addListener((changes, area) => {
			if(chrome.runtime.lastError){
				console.log(`chrome.storage.onChanged: ${chrome.runtime.lastError.message}`);
				return;
			}

			console.log(window.tabId)
			console.log(changes)

			autoPlay = changes?.['video-focus.autoPlay'] ? changes?.['video-focus.autoPlay'].newValue : autoPlay;
			paused = changes?.['video-focus.paused'] ? changes?.['video-focus.paused'].newValue : paused;
			enableFaceTrackng = changes?.['video-focus.enableFaceTrackng'] ? changes?.['video-focus.enableFaceTrackng'].newValue : enableFaceTrackng;
			enableFaceTrackngFullScreenOnly = changes?.['video-focus.enableFaceTrackngFullScreenOnly'] ? changes?.['video-focus.enableFaceTrackngFullScreenOnly'].newValue : enableFaceTrackngFullScreenOnly;
			autoPauseOnFullScreenChange = changes?.['video-focus.autoPauseOnFullScreenChange'] ? changes?.['video-focus.autoPauseOnFullScreenChange'].newValue : autoPauseOnFullScreenChange;
			autoPauseOnSwitchTab = changes?.['video-focus.autoPauseOnSwitchTab'] ? changes?.['video-focus.autoPauseOnSwitchTab']?.newValue : autoPauseOnSwitchTab;
			autoResume = changes?.['video-focus.autoResume'] ? changes?.['video-focus.autoResume'].newValue : autoResume;

			if(changes["video-focus.tabPauseMapping"] !== undefined){
				tabPauseMapping = changes["video-focus.tabPauseMapping"].newValue
			}

			if(changes["video-focus.faceDetectionFocus"] !== undefined){
				faceDetectionFocus = !!changes["video-focus.faceDetectionFocus"].newValue
			}		
		});

		frameListener()
	}

	chrome.storage.local.get([
		'video-focus.paused',
		'video-focus.faceDetectionFocus',
		'video-focus.tabPauseMapping',
		'video-focus.enableFaceTrackng',
		'video-focus.enableFaceTrackngFullScreenOnly',
		'video-focus.autoPlay',
		'video-focus.autoPauseOnFullScreenChange',
		'video-focus.autoPauseOnSwitchTab',
		'video-focus.autoResume',
	]).then(async(storage) => {
		if(chrome.runtime.lastError)
			console.log(`chrome.storage.local: ${chrome.runtime.lastError.message}`);

		console.log(window.tabId)
		console.log(storage)

		autoPlay = storage?.['video-focus.autoPlay'] ?? false;
		paused = storage?.['video-focus.paused'] ?? false;
		tabPauseMapping = storage?.["video-focus.tabPauseMapping"] ?? storage?.["video-focus.tabPauseMapping"]
		enableFaceTrackng = storage?.['video-focus.enableFaceTrackng'] ?? false;
		enableFaceTrackngFullScreenOnly = storage?.['video-focus.enableFaceTrackngFullScreenOnly'] ?? true;
		autoPauseOnFullScreenChange = storage?.['video-focus.autoPauseOnFullScreenChange'] ?? false;
		autoPauseOnSwitchTab = storage?.['video-focus.autoPauseOnSwitchTab'] ?? false;
		autoResume = storage?.['video-focus.autoResume'] ?? false;

		faceDetectionFocus = storage?.['video-focus.faceDetectionFocus'] ?? false;

		await loadAndRunController();
	})

}
catch(e){
	console.log('script already exist')
}