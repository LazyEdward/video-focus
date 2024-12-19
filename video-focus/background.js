// Copyright (c) 2024 LazyEdward
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

try{

	let activeTab = -1
	let sessionTabs = {};
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

		chrome.tabs.create({ url: 'tracker.html' }, () => {
			if(chrome.runtime.lastError){
				console.log(`chrome.tabs.create: ${chrome.runtime.lastError.message}`);
			}
		});
	}

	const requestPermission = async() => {
		chrome.tabs.create({ url: 'offscreen/permission.html' }, (tab) => {
			if(chrome.runtime.lastError){
				console.log(`chrome.tabs.create: ${chrome.runtime.lastError.message}`);
				permissionTab = -1
				return;
			}

			permissionTab = parseInt(tab.id)
		});
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
			if(chrome.runtime.lastError)
				console.log(`chrome.storage.local: ${chrome.runtime.lastError.message}`);

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
			
			chrome.storage.local.set({ "video-focus.activeTab": -1, "video-focus.tabPauseMapping": {}, "video-focus.faceDetectionFocus": false, "video-focus.trackingAvailable": false });
			sessionTabs = {}
			permissionTab = -1
			hasPermission = false

			await setupOffscreenDocument('tracker.html')
			// await requestPermission();
		})
	}

	// https://stackoverflow.com/questions/25004260/welcome-page-loads-when-allow-in-incognito-is-checked-unchecked-in-chrome
	chrome.runtime.onInstalled.addListener(async(details) => {
		if(chrome.runtime.lastError){
			console.log(`chrome.runtime.onInstalled: ${chrome.runtime.lastError.message}`);
			return;
		}

		console.log("Background Start Up");
		if(details.reason !== "install" && details.reason !== "update") return;
		await init()

		chrome.tabs.query({}, async(tabs) => {
			let orderedTabs = tabs.filter(tab => tab.status === "complete").sort((a, b) => !a.active - !b.active)
			// console.log(orderedTabs)
			for(let tab of orderedTabs){
				if(tab.url.startsWith("http://") || tab.url.startsWith("https://")){
					try{
						await chrome.scripting.executeScript({
							target: { tabId: tab.id },
							args: [tab.id],
							func: (id) => {
								window.tabId = id;
							}
						});
						await chrome.scripting.executeScript({ target: { tabId: tab.id }, files : [ "content.js" ], })
						console.log(`content script injected ${tab.id}`)
					}
					catch(e){
						console.log(`content script injection error ${tab.id}`)
						console.log(e)
					}
				}
			}
		})
	})
	
	chrome.tabs.onUpdated.addListener(async(tabId, changeInfo, tab) => {
		if(chrome.runtime.lastError){
			console.log(`chrome.tabs.onUpdated: ${chrome.runtime.lastError.message}`);
			return;
		}

		if (changeInfo.status === "complete"){
			if(tab.url.startsWith("http://") || tab.url.startsWith("https://")){
				try{
					await chrome.scripting.executeScript({
						target: { tabId: tab.id },
						args: [tab.id],
						func: (id) => {
							window.tabId = id;
						}
					});
					sessionTabs[tab.id] = true
					await chrome.scripting.executeScript({ target: { tabId }, files : [ "content.js" ], });
					console.log(`content script injected ${tabId}`)		
				}
				catch(e){
					console.log(`content script injection error ${tabId}`)
					console.log(e)
				}
			}
			else{
				if(sessionTabs[tabId])
					delete sessionTabs[tabId]
			}
			console.log(sessionTabs)
		}
	})

	chrome.tabs.onActivated.addListener(async(activeInfo) => {
		if(chrome.runtime.lastError){
			console.log(`chrome.tabs.onActivated: ${chrome.runtime.lastError.message}`);
			return;
		}

		chrome.tabs.get(activeInfo.tabId, async(tab) => {
			if(chrome.runtime.lastError){
				console.log(`chrome.tabs.get: ${chrome.runtime.lastError.message}`);
				return;
			}		

			console.log('chrome.tabs.onActivated')
			console.log(tab)

			if(tab.url.startsWith("http://") || tab.url.startsWith("https://")){
				if(!sessionTabs[activeInfo.tabId]){
					try{
						await chrome.scripting.executeScript({
							target: { tabId: tab.id },
							args: [tab.id],
							func: (id) => {
								window.tabId = id;
							}
						});
						await chrome.scripting.executeScript({ target: { tabId: tab.id }, files : [ "content.js" ], });
						console.log(`content script injected ${tab.id}`)
					}
					catch(e){
						console.log(`content script injection error ${activeInfo.tabId}`)
						console.log(e)
					}
				}
			}
			else{
				chrome.storage.local.set({ "video-focus.activeTab": -1 })
				activeTab = -1
				if(sessionTabs[activeInfo.tabId])
					delete sessionTabs[activeInfo.tabId]
			}
			console.log(sessionTabs)
		})
	})

	chrome.windows.onFocusChanged.addListener((windowId) => {
		if(chrome.runtime.lastError){
			console.log(`chrome.tabs.onFocusChanged: ${chrome.runtime.lastError.message}`);
			return;
		}

		if(windowId === chrome.windows.WINDOW_ID_NONE){
			setTimeout(() => {
				if(activeTab === -1)
					chrome.storage.local.set({ "video-focus.trackingAvailable": false })
			}, 5000)
			return;
		}

		chrome.tabs.query({active: true, windowId}, async(tabs) => {
			if(tabs.length > 0 && tabs[0]){
				let tab = tabs[0]
				// console.log('chrome.windows.onFocusChanged')
				// console.log(tab)
				if (tab.status === "complete"){
					if(tab.url.startsWith("http://") || tab.url.startsWith("https://")){
						if(!sessionTabs[tab.id]){
							try{
								await chrome.scripting.executeScript({
									target: { tabId: tab.id },
									args: [tab.id],
									func: (id) => {
										window.tabId = id;
									}
								});
								await chrome.scripting.executeScript({ target: { tabId: tab.id }, files : [ "content.js" ], });
								console.log(`content script injected ${tab.id}`)
							}
							catch(e){
								console.log(`content script injection error ${tab.id}`)
								console.log(e)
							}
						}
					}
					else{
						chrome.storage.local.set({ "video-focus.activeTab": -1 })
						activeTab = -1
						if(sessionTabs[tab.tabId])
							delete sessionTabs[tab.tabId]
					}
				}
			}
			console.log(sessionTabs)
		})

	}, {windowTypes: ['normal']})

	chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
		if(chrome.runtime.lastError){
			console.log(`chrome.tabs.onRemoved: ${chrome.runtime.lastError.message}`);
			return;
		}

		if(sessionTabs[tabId]){
			delete sessionTabs[tabId]
			chrome.storage.local.get([
				'video-focus.tabPauseMapping',
			]).then(async(storage) => {
				if(chrome.runtime.lastError)
					console.log(`chrome.storage.local: ${chrome.runtime.lastError.message}`);
				
				let tabPauseMapping = {...storage['video-focus.tabPauseMapping']}
				delete tabPauseMapping[tabId]

				chrome.storage.local.set({ "video-focus.tabPauseMapping": tabPauseMapping });
			})
		}
	})

	chrome.storage.onChanged.addListener(async(changes, area) => {
		console.log(changes)

		if(changes['video-focus.activeTab']){
			if(changes['video-focus.activeTab'].newValue !== -1){
				sessionTabs[changes['video-focus.activeTab'].newValue] = true
				activeTab = changes['video-focus.activeTab'].newValue
			}
			else
				activeTab = -1

			console.log(sessionTabs)
		}

		if(changes['video-focus.enableFaceTrackng'] || changes['video-focus.trackingAvailable']){
			if(hasPermission){
				chrome.storage.local.get([
					'video-focus.paused',
					'video-focus.trackingAvailable',
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
					if(chrome.runtime.lastError)
						console.log(`chrome.storage.local: ${chrome.runtime.lastError.message}`);
	
					chrome.runtime.sendMessage({
						type: 'updateSettings',
						target: 'video-focus.updateSettings',
						data: JSON.stringify(storage)
					})
				})
			}
		}
	})

	chrome.runtime.onMessage.addListener((req, sender, sendRes) => {

		if(chrome.runtime.lastError){
			console.log(`chrome.runtime.onMessage: ${chrome.runtime.lastError.message}`);
			return;
		}

		if(req.target === "video-focus.permissionGranted"){
			console.log("video-focus.permissionGranted")
			if(permissionTab !== -1 && req.data){
				chrome.tabs.get(permissionTab, () => {
					if(chrome.runtime.lastError){
						console.log(`chrome.tabs.get: ${chrome.runtime.lastError.message}`);
					}
					else{
						chrome.tabs.remove(permissionTab, () => {
							if(chrome.runtime.lastError)
								console.log(`chrome.tabs.remove: ${chrome.runtime.lastError.message}`);
						})
					}
					
					permissionTab = -1
					hasPermission = true
	
					if(!paused && enableFaceTrackng){			
						if(hasPermission){
							chrome.storage.local.get([
								'video-focus.paused',
								'video-focus.trackingAvailable',
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
								if(chrome.runtime.lastError)
									console.log(`chrome.storage.local: ${chrome.runtime.lastError.message}`);
	
								chrome.runtime.sendMessage({
									type: 'initSettings',
									target: 'video-focus.initSettings',
									data: JSON.stringify(storage)
								})
							})
						}
					}
				})
			}
			else
				hasPermission = false
		}

		if(req.target === 'video-focus.fetchSetting' && hasPermission){
			chrome.storage.local.get([
				'video-focus.paused',
				'video-focus.trackingAvailable',
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
				if(chrome.runtime.lastError)
					console.log(`chrome.storage.local: ${chrome.runtime.lastError.message}`);

				chrome.runtime.sendMessage({
					type: 'initSettings',
					target: 'video-focus.initSettings',
					data: JSON.stringify(storage)
				})
			})
		}

		if(req.target === "video-focus.updateSettings"){
			let data = JSON.parse(req.data);
			console.log("updateSettings")
			console.log(data)
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
	
	});

}
catch(e){
	console.log('failed to run background script')
	console.log(e)
}