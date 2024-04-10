// Copyright (c) 2024 LazyEdward
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

try{
	const askWebcamPermission = async() => {
		try {
			let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
	
			if(!stream)
				throw Error()
	
			console.log('Webcam permission is given')
			// console.log(stream)
			/* use the stream */
			stream.removeTrack(stream.getVideoTracks()[0]);

			// chrome.tabs.create({ url: chrome.runtime.getURL("tracker.html") })

			chrome.runtime.sendMessage({
				type: 'permissionGranted',
				target: 'video-focus.permissionGranted',
				data: true
			});

		} catch (err) {
			/* handle the error */
			// alert('Webcam permission is not given')
			console.log('Webcam permission is not given')
			console.log(err)

			chrome.runtime.sendMessage({
				type: 'permissionGranted',
				target: 'video-focus.permissionGranted',
				data: false
			});

		}
	}

	askWebcamPermission()

}
catch(e){
	console.log('cannot run script: ')
	console.log(e)
}