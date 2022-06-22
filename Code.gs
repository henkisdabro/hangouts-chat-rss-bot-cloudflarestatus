// URL of the RSS feed to parse
var RSS_FEED_URL = "https://www.cloudflarestatus.com/history.atom";

// Webhook URL of the Hangouts Chat room
var WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/[SPACE]/messages?key=[KEY + TOKEN]";

// When DEBUG is set to true, the topic is not actually posted to the room
var DEBUG = false;

function fetchNews() {

  var lastUpdate = new Date(parseFloat(PropertiesService.getScriptProperties().getProperty("lastUpdate")) || 0);

  Logger.log("Last update: " + lastUpdate);

  Logger.log("Fetching '" + RSS_FEED_URL + "'...");
  var namespace = XmlService.getNamespace("http://www.w3.org/2005/Atom");
  var xml = UrlFetchApp.fetch(RSS_FEED_URL).getContentText();
  var document = XmlService.parse(xml);
  var items = document.getRootElement().getChildren('entry', namespace).reverse();

  Logger.log(items.length + " entrie(s) found");

  var count = 0;
  for (var i = 0; i < items.length; i++) {

    var pubDate = new Date(items[i].getChild('published', namespace).getText());

    //var og = items[i].getChild('og');
    var title = items[i].getChild('title', namespace).getText();
    var description = items[i].getChild('content', namespace).getText();
    var link = "https://www.cloudflarestatus.com/";

    if (DEBUG) {
      Logger.log("------ " + (i + 1) + "/" + items.length + " ------");
      Logger.log(pubDate);
      Logger.log(title);
      Logger.log(link);
      // Logger.log(description);
      Logger.log("--------------------");
    }

    if (pubDate.getTime() > lastUpdate.getTime()) {
      Logger.log("Posting topic '" + title + "'...");
      if (!DEBUG) {
        postTopic_(title, description, link);
      }
      PropertiesService.getScriptProperties().setProperty("lastUpdate", pubDate.getTime());
      count++;
    }
  }

  Logger.log("> " + count + " new(s) posted");
}

function postTopic_(title, description, link) {

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({
      "cards": [
        {
          "header": {
            "title": title
          },
          "sections": [
            {
              "widgets": [
                {
                  "textParagraph": {
                    "text": description
                  }
                },
                {
                  "keyValue": {
                    "topLabel": "Link",
                    "content": link,
                    "icon": "BOOKMARK"
                  }
                }
              ]
            }
          ]
        }
      ]
    })
  };
  Logger.log(options);

  UrlFetchApp.fetch(WEBHOOK_URL, options);
}
