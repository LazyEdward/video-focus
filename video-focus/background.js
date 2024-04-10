// Copyright (c) 2024 LazyEdward
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

try{

	let permissionTab = -1;
	let creatingOffscreen = null;

	let hasPermission = false;
	let paused = false;
	let enableFaceTrackng = false;

	let defaultDetector = "tiny_face"

	let inputSize = 224;
	let scoreThreshold = 0.5;
	let minConfidence = 0.5;

	const requestDebugPage = async() => {
		if(!hasPermission){
			await requestPermission();
		}

		chrome.tabs.create({ url: 'tracker.html' });
	}

	const requestPermission = async() => {
		chrome.tabs.create({ url: 'offscreen/permission.html' }, (tab) =>  permissionTab = tab.id);
	}

	// https://developer.chrome.com/docs/extensions/reference/api/offscreen
	const setupOffscreenDocument = async(path) => {
		// Check all windows controlled by the service worker to see if one
		// of them is the offscreen document with the given path
		try{
			const offscreenUrl = chrome.runtime.getURL(path);
			const existingContexts = await chrome.runtime.getContexts({
				contextTypes: ['OFFSCREEN_DOCUMENT'],
				documentUrls: [offscreenUrl]
			});
		
			if (existingContexts.length > 0)
				return;
		
			// create offscreen document
			if (!creatingOffscreen) {
				creatingOffscreen = chrome.offscreen.createDocument({
					url: path,
					reasons: [ chrome.offscreen.Reason.USER_MEDIA ],
					justification: "keep service worker running and record audio",
				});
			}
	
			await creatingOffscreen;
			creatingOffscreen = null;

		}
		catch(e){
			console.log(e)
		}
	}

	const init = async() => {
	
		chrome.storage.local.get([
			'video-focus.paused',
			"video-focus.defaultDetector",
			'video-focus.inputSize',
			'video-focus.scoreThreshold',
			"video-focus.minConfidence",
			'video-focus.enableFaceTrackng',
			'video-focus.enableFaceTrackngFullScreenOnly',
			'video-focus.autoPlay',
			'video-focus.autoPauseOnFullScreenChange',
			'video-focus.autoPauseOnSwitchTab',
			'video-focus.autoResume',
		]).then(async(storage) => {
			if(!storage){
				chrome.storage.local.set({
					"video-focus.paused": paused,
					"video-focus.defaultDetector": defaultDetector,
					"video-focus.inputSize": inputSize,
					"video-focus.scoreThreshold": scoreThreshold,
					"video-focus.minConfidence": minConfidence,
					"video-focus.enableFaceTrackng": enableFaceTrackng,
					"video-focus.enableFaceTrackngFullScreenOnly": true,
					"video-focus.autoPlay": false,
					"video-focus.autoPauseOnFullScreenChange": true,
					"video-focus.autoPauseOnSwitchTab": true,
					"video-focus.autoResume": true
				});
			}
			else{

				if(storage['video-focus.paused'])
					paused = storage['video-focus.paused']
				else
					chrome.storage.local.set({ "video-focus.paused": paused });

				if(storage['video-focus.enableFaceTrackng'])
					enableFaceTrackng = storage['video-focus.enableFaceTrackng']
				else
					chrome.storage.local.set({ "video-focus.enableFaceTrackng": enableFaceTrackng });

				if(!storage['video-focus.enableFaceTrackngFullScreenOnly'])
					chrome.storage.local.set({ "video-focus.enableFaceTrackngFullScreenOnly": true });
	
				if(!storage['video-focus.autoPlay'])
					chrome.storage.local.set({ "video-focus.autoPlay": false });

				if(storage['video-focus.defaultDetector'])
					defaultDetector = storage['video-focus.defaultDetector'];
				else
					chrome.storage.local.set({ "video-focus.defaultDetector": defaultDetector });
	
				if(storage['video-focus.inputSize'])
					inputSize = storage['video-focus.inputSize'];
				else
					chrome.storage.local.set({ "video-focus.inputSize": inputSize });
	
				if(storage['video-focus.scoreThreshold'])
					scoreThreshold = storage['video-focus.scoreThreshold'];
				else
					chrome.storage.local.set({ "video-focus.scoreThreshold": scoreThreshold });
				
				if(storage['video-focus.minConfidence'])
					minConfidence = storage['video-focus.minConfidence'];
				else
					chrome.storage.local.set({ "video-focus.minConfidence": minConfidence });

				if(!storage['video-focus.autoPauseOnFullScreenChange'])
					chrome.storage.local.set({ "video-focus.autoPauseOnFullScreenChange": true });
	
				if(!storage['video-focus.autoPauseOnSwitchTab'])
					chrome.storage.local.set({ "video-focus.autoPauseOnSwitchTab": true });
	
				if(!storage['video-focus.autoResume'])
					chrome.storage.local.set({ "video-focus.autoResume": true });
			}
			
			chrome.storage.local.set({ "video-focus.faceDetectionFocus": false });
			permissionTab = -1
			hasPermission = false

			await setupOffscreenDocument('tracker.html')
			await requestPermission();
		})
	}
	
	// const testSetTimeout = () => {
	// 	console.log(`Test setTimeout ${Date.now()}`)
	// 	setTimeout(() => testSetTimeout())
	// }

	// https://stackoverflow.com/questions/25004260/welcome-page-loads-when-allow-in-incognito-is-checked-unchecked-in-chrome
	chrome.runtime.onInstalled.addListener(async(details) => {
		console.log("Background Start Up");
		if(details.reason !== "install" && details.reason !== "update") return;
		await init()
		// testSetTimeout();
	})
	
	chrome.tabs.onUpdated.addListener(async(tabId, changeInfo, tab) => {
		if (changeInfo.status === "complete"){
			if(tab.url.startsWith("http://") || tab.url.startsWith("https://"))
				chrome.scripting.executeScript({ target: { tabId }, files : [ "content.js" ], }).then(() => console.log("content script injected"));
		}
	})

	// chrome.storage.onChanged.addListener(async(changes, area) => {
	// 	console.log(changes)
	// })

	chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
		try{
			if (chrome.runtime.lastError)
				throw Error('chrome.runtime.lastError');

			if(req.target === "video-focus.permissionGranted"){
				console.log("video-focus.permissionGranted")
				if(req.data){
					chrome.tabs.remove(permissionTab)
					permissionTab = -1
					hasPermission = true

					if(!paused && enableFaceTrackng){			
						if(hasPermission){
							chrome.storage.local.get([
								'video-focus.paused',
								"video-focus.defaultDetector",
								'video-focus.inputSize',
								'video-focus.scoreThreshold',
								"video-focus.minConfidence",
								'video-focus.enableFaceTrackng',
								'video-focus.enableFaceTrackngFullScreenOnly',
								'video-focus.autoPlay',
								'video-focus.autoPauseOnFullScreenChange',
								'video-focus.autoPauseOnSwitchTab',
								'video-focus.autoResume',
							]).then(async(storage) => {
								chrome.runtime.sendMessage({
									type: 'initSettings',
									target: 'video-focus.initSettings',
									data: JSON.stringify(storage)
								})
							})
						}
					}
				}
				else
					hasPermission = false
			}

			if(req.target === 'video-focus.fetchSetting' && hasPermission){
				chrome.storage.local.get([
					'video-focus.paused',
					"video-focus.defaultDetector",
					'video-focus.inputSize',
					'video-focus.scoreThreshold',
					"video-focus.minConfidence",
					'video-focus.enableFaceTrackng',
					'video-focus.enableFaceTrackngFullScreenOnly',
					'video-focus.autoPlay',
					'video-focus.autoPauseOnFullScreenChange',
					'video-focus.autoPauseOnSwitchTab',
					'video-focus.autoResume',
				]).then(async(storage) => {
					chrome.runtime.sendMessage({
						type: 'initSettings',
						target: 'video-focus.initSettings',
						data: JSON.stringify(storage)
					})
				})
			}

			if(req.target === "video-focus.updateSettings"){
				let data = JSON.parse(req.data);
				if(!hasPermission && !data['video-focus.paused'] && data['video-focus.enableFaceTrackng'])
					requestPermission()

				chrome.storage.local.set(data)
			}

			if(req.target === "video-focus.faceDetectionFocus")
				chrome.storage.local.set({ "video-focus.faceDetectionFocus": req.data });

			if(req.target === "video-focus.requestDebugPage")
				requestDebugPage()

			if(req.target === "video-focus.keepAlivePing")
				console.log("video-focus.keepAlivePing");
		}
		catch(e){
			console.log(e)
		}
	});

}
catch(e){
	console.log('failed to run background script')
	console.log(e)
}