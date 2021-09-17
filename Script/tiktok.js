const ISO2 = "JP"; // 国家代码简写

if ($script.type === "http-request") {
  let url = filter($request.url)
  if ($request.method === "POST") {
    $done({ response: { status: 307, headers: { Location: url } } });
  } else {
    $done({ response: { status: 302, headers: { Location: url } } });
  }
} else {
  let body = $response.body.replace(/"room_id":(\d+)/g,'"room_id":"$1"');
  let obj = JSON.parse(body);
  if (obj.data) obj.data = filter_data(obj.data);
  if (obj.aweme_list) obj.aweme_list = filter_list(obj.aweme_list);
  $done({ body: JSON.stringify(obj) });
}

function filter(url) {
  url = url.replace(/region=CN/g, `region=${ISO2}`);
  if (url.match(/\/v2\/feed\/\?/)) {
    return url.replace("/v2/", "/v1/");
  } else if (url.match(/\/get_domains\/v5\/\?/)) {
    return url.replace(/\?.+$/, "");
  } else {
    return url;
  }
}

function filter_data(array) {
  let i = array.length;
  while (i--) {
    if (array[i].aweme.status) patch(array[i].aweme);
  }
  return array;
}

function filter_list(array) {
  let i = array.length;
  while (i--) {
    if (array[i].live_reason) {
      array.splice(i, 1);
    } else if (array[i].status) {
      patch(array[i]);
    }
  }
  return array;
}

function patch(aweme) {
  try {
    aweme.status.reviewed = 1;
    aweme.video_control.allow_download = true;
    aweme.video_control.prevent_download_type = 0;
    delete aweme.video.misc_download_addrs;
    const play_url = aweme.video.play_addr;
    aweme.video.download_addr = play_url;
    aweme.video.download_suffix_logo_addr = play_url;
  } catch (error) {
    console.log(`\n${error}\n${JSON.stringify(aweme)}`);
  }
  return aweme;
}