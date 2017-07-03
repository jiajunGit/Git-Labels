var ExistingIssuePageController = function(layoutManager) {
    this.GitLabelListQuery = ".sidebar-labels .select-menu-modal";
    this.GitLabelListLocation = ".sidebar-labels .select-menu-modal-holder .js-select-menu-deferred-content";
    this.GitLabelListItemLocation = ".sidebar-labels .select-menu-modal-holder .js-select-menu-deferred-content .select-menu-list .select-menu-item";
     /*
        this.storage,
        this.layoutManager,
        this.sideBarObserver
    */
}

ExistingIssuePageController.prototype.getDataForPOSTRequest = function() {

    var formElement = document.querySelector(".discussion-sidebar .sidebar-labels .js-issue-sidebar-form");

    if(!formElement){
        return null;
    }

    var url = formElement.getAttribute("action");

    if(!url){
        return null;
    }

    var utf8TokenElement = formElement.querySelector("input[name='utf8']");

    if(!utf8TokenElement){
        return null;
    }

    var utf8Token = utf8TokenElement.getAttribute("value");

    if(typeof(utf8Token) !== "string"){
        return null;
    }

    var postMethodElement = formElement.querySelector("input[name='_method']");

    if(!postMethodElement){
        return null;
    }

    var postMethod = postMethodElement.getAttribute("value");

    if(typeof(postMethod) !== "string"){
        return null;
    }

    var tokenElement = formElement.querySelector("input[name='authenticity_token']");

    if(!tokenElement){
        return null;
    }

    var token = tokenElement.getAttribute("value");

    if(typeof(token) !== "string"){
        return null;
    }

    return { url: url, utf8Token: utf8Token, postMethod: postMethod ,token: token };
}

ExistingIssuePageController.prototype.handleExternalApplyLabelsEvent = function() {

    if(!this.storage || !this.layoutManager){
        return false;
    }

    var postInfo = this.getDataForPOSTRequest();

    if(!postInfo){
        return false;
    }

    var data = "utf8=" + encodeURIComponent(postInfo.utf8Token) + "&_method=" + encodeURIComponent(postInfo.postMethod);
    data += ("&authenticity_token=" + encodeURIComponent(postInfo.token));
    data += ("&" + encodeURIComponent("issue[labels][]") + "=");

    var selectedItemIDsIter = this.storage.getSelectedItemIDsIterator();
    while(true){

        var itemIDObj = selectedItemIDsIter.next();

        if(itemIDObj.done){
            break;
        }

        var itemID = itemIDObj.value;
        var item = this.storage.getItem(itemID);

        if(!item){
            continue;
        }

        data += ("&" + encodeURIComponent("issue[labels][]") + "=" + encodeURIComponent((item.getFullName())));
    }

    $.post(postInfo.url, data)
     .done(this.handleSuccessfulPostRequest.bind(this))
     .fail(this.handleUnsuccessfulPostRequest.bind(this));

    return true;
}

ExistingIssuePageController.prototype.replaceGitFormData = function(newUTF8Value, newMethodValue, newAuthTokenValue) {

    var oldForm = document.body.querySelector(".discussion-sidebar-item.sidebar-labels.js-discussion-sidebar-item form.js-issue-sidebar-form");

    if(!oldForm){
        return false;
    }

    if(newUTF8Value){
        var oldUTF8 = oldForm.querySelector("input[name='utf8']");
        if(oldUTF8){
            oldUTF8.setAttribute("value", newUTF8Value);
        }
    }

    if(newMethodValue){
        var oldMethod = oldForm.querySelector("input[name='_method']");
        if(oldMethod){
            oldMethod.setAttribute("value", newMethodValue);
        }
    }

    if(newAuthTokenValue){
        var oldAuthToken = oldForm.querySelector("input[name='authenticity_token']");
        if(oldAuthToken){
            oldAuthToken.setAttribute("value", newAuthTokenValue);
        }
    }

    return true;
}

ExistingIssuePageController.prototype.updateGitFormData = function($parsedResponse) {

    var $newForm = $parsedResponse.find(".discussion-sidebar-item.sidebar-labels.js-discussion-sidebar-item form.js-issue-sidebar-form");

    if(!$newForm){
        return false;
    }

    var $newUTF8 = $newForm.find("input[name='utf8']");
    if($newUTF8){
        var newUTF8Value = $newUTF8.attr("value");
    }

    var $newMethod = $newForm.find("input[name='_method']");
    if($newMethod){
        var newMethodValue = $newMethod.attr("value");
    }

    var $newAuthToken = $newForm.find("input[name='authenticity_token']");
    if($newAuthToken){
        var newAuthTokenValue = $newAuthToken.attr("value");
    }
    
    return this.replaceGitFormData(newUTF8Value, newMethodValue, newAuthTokenValue);
}

ExistingIssuePageController.prototype.replaceGitLabelsDisplay = function(labelSideBarItem) {

    if(!labelSideBarItem){
        return false;
    }

    var $labelSideBarItem = $(labelSideBarItem);
    var $newLabelsDisplay = null;

    try{
        $newLabelsDisplay = $labelSideBarItem.find(".labels.css-truncate");
    } catch(exception){
        return false;
    }

    this.updateGitFormData($labelSideBarItem);

    if(!$newLabelsDisplay){
        return false;
    }

    var oldLabelsDisplay = document.body.querySelector(".discussion-sidebar-item.sidebar-labels.js-discussion-sidebar-item .labels.css-truncate");
    if(!oldLabelsDisplay){
        return false;
    }

    $(oldLabelsDisplay).replaceWith($newLabelsDisplay);

    return true;
}

ExistingIssuePageController.prototype.processReplyForSideBar = function(reply) {

    if(!reply){
        return false;
    }

    var $reply = $(reply);
    var $newLabelsDisplay = null;

    try{
        $newLabelsDisplay = $(reply).find(".discussion-sidebar-item.sidebar-labels.js-discussion-sidebar-item .labels.css-truncate"); 
    } catch(exception) {
        return false;
    }

    this.updateGitFormData($reply);

    if(!$newLabelsDisplay){
        return false;
    }

    var oldLabelsDisplay = document.body.querySelector(".discussion-sidebar-item.sidebar-labels.js-discussion-sidebar-item .labels.css-truncate");
    if(!oldLabelsDisplay){
        return false;
    }

    $(oldLabelsDisplay).replaceWith($newLabelsDisplay);

    return true;
}

ExistingIssuePageController.prototype.updatedGitLabelsDisplay = function(response) {

    var discussionSideBar = document.getElementById("partial-discussion-sidebar");

    if(!discussionSideBar){
        return this.replaceGitLabelsDisplay(response);
    }

    var url = discussionSideBar.getAttribute("data-url");

    if(!url){
        return this.replaceGitLabelsDisplay(response);
    }

    $.get(url)
     .done(function(reply){
        if(!this.processReplyForSideBar(reply)){
            this.replaceGitLabelsDisplay(response);
        }
     }.bind(this))
     .fail(function(){
        this.replaceGitLabelsDisplay(response);
     }.bind(this));

    return true;
}

ExistingIssuePageController.prototype.handleSuccessfulPostRequest = function(response) {
    this.retrieveLabelsFromGETRequest();
    this.updatedGitLabelsDisplay(response);
}

ExistingIssuePageController.prototype.handleUnsuccessfulPostRequest = function() {
    this.retrieveLabelsFromGETRequest();
}

ExistingIssuePageController.prototype.recoverLabelsInGitDOM = function(data) {

    var parent = document.body.querySelector(this.GitLabelListLocation);

    if(!parent){
        return false;
    }

    $(parent).html(data);

    return true;
}

ExistingIssuePageController.prototype.processGETResponse = function(data) {
    if(this.layoutManager){
        this.recoverLabelsInGitDOM(data);
        this.storage = this.getLabelsFromDOM();
        this.layoutManager.initializeUI(this.storage);
    }
}

ExistingIssuePageController.prototype.retrieveLabelsFromGETRequest = function() {

    var urlElement = document.querySelector( ".discussion-sidebar .sidebar-labels div.label-select-menu" );

    if(!urlElement){
        return false;
    }

    var url = urlElement.getAttribute("data-contents-url");

    if(!url){
        return false;
    }

    $.get(url)
     .done(this.processGETResponse.bind(this));

    return true;
}

ExistingIssuePageController.prototype.getLabelsFromDOM = function() {

    var items = document.body.querySelectorAll(this.GitLabelListItemLocation);

    if(items.length <= 0){
        return null;
    }

    var storage = new ItemStorage();

    for(var i = 0; i < items.length; ++i){

        var item = items[i];

        var nameNode = item.querySelector(".select-menu-item-text .color-label");
        if(!nameNode){
            continue;
        }

        var name = nameNode.getAttribute("data-name");
        if(!name){
            continue;
        }

        var colorNode = item.querySelector(".select-menu-item-text .color");
        if(!colorNode){
            continue;
        }
        
        var color = colorNode.style.backgroundColor;
        if(!color){
            continue;
        }

        var selectedNode = item.querySelector(".select-menu-item-text input");
        if(!selectedNode){
            continue;
        }
        var isSelected = selectedNode.hasAttribute("checked");

        storage.addItem(new LabelItem(name, color, isSelected));
    }

    return storage;
}

ExistingIssuePageController.prototype.hasPermissionToManageLabels = function() {
    return document.body.querySelector(this.GitLabelListQuery) != null;
}

ExistingIssuePageController.prototype.run = function(layoutManager) {
    if(layoutManager && this.hasPermissionToManageLabels()){
        this.layoutManager = layoutManager;
        this.setupGitDOMListeners();
        this.storage = this.getLabelsFromDOM();
        if(!this.storage){
            this.retrieveLabelsFromGETRequest();
        } else {
            this.layoutManager.initializeUI(this.storage);
        }
    }
}

ExistingIssuePageController.prototype.handleClickEvent = function() {
    if(this.layoutManager){
        this.layoutManager.toggleSideBar();
    }
}

ExistingIssuePageController.prototype.overrideLabelButtonListeners = function() {

    var gitLabelButton = document.body.querySelector(".sidebar-labels .label-select-menu button.discussion-sidebar-toggle");

    if(gitLabelButton){
        gitLabelButton.classList.remove("js-menu-target");
        gitLabelButton.removeEventListener("click", this.handleClickEvent.bind(this), true);
        gitLabelButton.addEventListener("click", this.handleClickEvent.bind(this), true);
    }
}

ExistingIssuePageController.prototype.attachGitSideBarObserver = function() {

    var gitSideBar = document.body.querySelector(".discussion-sidebar");

    if(gitSideBar){

        this.sideBarObserver = new MutationObserver(function(mutations) {
            for(var i = 0; i < mutations.length; ++i){
                this.overrideLabelButtonListeners();
            }  
        }.bind(this));

        this.sideBarObserver.observe(gitSideBar, { childList: true });
    }
}

ExistingIssuePageController.prototype.cleanUp = function() {
    if(this.sideBarObserver){
        this.sideBarObserver.disconnect();
        this.sideBarObserver = null;
    }
}

ExistingIssuePageController.prototype.setupGitDOMListeners = function() {
    this.overrideLabelButtonListeners();
    this.attachGitSideBarObserver();
}