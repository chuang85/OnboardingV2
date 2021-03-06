﻿define(['plugins/router', 'durandal/app', 'services/dataservices', 'services/dataformatter', 'services/jsonbuilder', 'services/dbhelper'],
    function (router, app, dataservices, dataformatter, jsonbuilder, dbhelper) {

        var vm = {
            /* Request data */
            contact: ko.observable(window.currentUser),
            requestSubject: ko.observable(),
            requestType: ko.observable(),

            /* SPT data */
            sptList: ko.observableArray([]),
            chosenSptName: ko.observable(),
            chosenSptContent: ko.observable(),
            displayName: ko.observable(),
            serviceType: ko.observable(),
            appPrincipalId: ko.observable(),
            objectId: ko.observable(),
            serviceTypeList: ko.observableArray(),
            constrainedDelegationTo: ko.observableArray(),
            externalUserAccountDelegationsAllowed: ko.observable(),
            microsoftPolicyGroup: ko.observable(),
            managedExternally: ko.observable(),

            /* public functions */
            activate: activate,
            canDeactivate: canDeactivate,
            addItem: addItem,
            search: search,
            createEntity: createEntity,

            /* descripstions */
            descContact: ko.observable(),
            descRequestSubject: ko.observable(),
            descDisplayName: ko.observable(),
            descServiceType: ko.observable(),
            descAppPrincipalId: ko.observable(),
            descEnvironment: ko.observable(),
        };

        var serviceName = dataservices.serviceName();

        var manager = dataservices.manager();

        var hasSubmitted = false;

        var hasCreated = false;

        // Prevent metaData not fetched exception
        var metaDataFetched = false;

        function activate() {
            clearInputOnloading();
            if (!manager.metadataStore.hasMetadataFor(serviceName)) {
                loadDataFromDb();
                manager.metadataStore.fetchMetadata(serviceName, fetchMetadataSuccess, fetchMetadataSuccess)
                .then(dataservices.fetchEnum);
            }

            function fetchMetadataSuccess(rawMetadata) {
                toastr.info("Loading data on initialization...");
                metaDataFetched = true;
            }

            function fetchMetadataFail(exception) {
                toastr.error("Fetch metadata failed");
            }
        }

        function canDeactivate() {
            if (!hasCreated) {
                return app.showMessage('Update is not finished, are you sure you want to leave this page?', 'Update Not Finished', ['Yes', 'No']);
            } else {
                return true;
            }
        };

        function createEntity() {
            if (metaDataFetched && !hasSubmitted) {
                hasSubmitted = true;
                determinRequestType();
                var xmlString = dataformatter.removeUndefined(dataformatter.formatXml(dataformatter.json2xml(jsonbuilder.createJSONSpt(vm))));
                console.log(xmlString)
                var newOnboardingRequest = manager.
                    createEntity('OnboardingRequest:#Onboarding.Models',
                    {
                        CreatedBy: vm.contact(),
                        RequestSubject: vm.requestSubject(),
                        TempXmlStore: xmlString,
                        Type: vm.requestType(),
                        State: RequestState.Created
                    });
                manager.addEntity(newOnboardingRequest);
                manager.saveChanges()
                    .then(createSucceeded)
                    .fail(createFailed);

                function createSucceeded(data) {
                    hasCreated = true;
                    toastr.success("Created");
                    router.navigate('#/viewRequest');
                }

                function createFailed(error) {
                    hasSubmitted = false;
                    toastr.error("Create failed");
                    console.log(error);
                    manager.rejectChanges();
                }
            }
        }

        function addItem(envType, itemType) {
            var fieldWrapper = $("<div class=\"fieldwrapper row\" />");
            var inputField = $("<input class=\"form-control\" />");
            var removeButton = $("<span class=\"pull-right pointerLink glyphicon glyphicon-trash\"></span>");

            removeButton.click(function () {
                $(this).parent().remove();
            });

            fieldWrapper.append(inputField);
            fieldWrapper.append(removeButton);
            $("." + envType + "-" + itemType + "-section").append(fieldWrapper);
        }

        function search() {
            if (metaDataFetched) {
                dbhelper.getSptByName(vm);
                parseSpt(vm.chosenSptContent());
                $('.form-need-hidden').show();
            }
        }

        /********************PRIVATE METHODS********************/
        function clearInputOnloading() {
            hasCreated = false;
            hasSubmitted = false;
            $('.form-need-hidden').hide();
        }

        function loadDataFromDb() {
            dbhelper.getExistingSptsNames(vm);
            dbhelper.getServiceTypes(vm);
            dbhelper.getDescriptions(vm);
        }

        function loadXMLString(txt) {
            var xmlDoc;
            if (window.DOMParser) {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(txt.toString(), "text/xml");
            }
            else // code for IE
            {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(txt);
            }
            return xmlDoc;
        }

        function parseSpt(xml) {
            var spt = loadXMLString(xml);
            var displayName = getTagValue(spt, "DisplayName");
            if (displayName) {
                vm.displayName(displayName);
            } else {
                vm.displayName("");
            }

            var serviceType = getTagNested(spt, "ServiceType");
            if (serviceType) {
                vm.serviceType(serviceType);
            } else {
                vm.serviceType("");
            }

            var appPrincipalId = getTagValue(spt, "AppPrincipalID");
            if (appPrincipalId) {
                vm.appPrincipalId(appPrincipalId);
            } else {
                vm.appPrincipalId("");
            }

            var objectId = getTagAttribute(spt, "DirectoryObject", "ObjectId");
            if (objectId) {
                vm.objectId(objectId);
            } else {
                vm.objectId("");
            }

            var constrainedDelegationTo = spt.getElementsByTagName("ConstrainedDelegationTo")[0].childNodes[0];
            if (constrainedDelegationTo) {
                var ss = constrainedDelegationTo.textContent.split(", ");
                for (var i in ss) {
                    vm.constrainedDelegationTo.push(ss[i]);
                }
            } else {
                vm.constrainedDelegationTo([]);
            }

            var externalUserAccountDelegationsAllowed = spt.getElementsByTagName("ExternalUserAccountDelegationsAllowed")[0];
            if (externalUserAccountDelegationsAllowed) {
                vm.externalUserAccountDelegationsAllowed(externalUserAccountDelegationsAllowed.childNodes[0].nodeValue);
            } else {
                vm.externalUserAccountDelegationsAllowed("");
            }

            var microsoftPolicyGroup = spt.getElementsByTagName("MicrosoftPolicyGroup")[0];
            if (microsoftPolicyGroup) {
                vm.microsoftPolicyGroup(microsoftPolicyGroup.childNodes[0].nodeValue);
            } else {
                vm.microsoftPolicyGroup("");
            }

            var managedExternally = spt.getElementsByTagName("ManagedExternally")[0];
            if (managedExternally) {
                vm.managedExternally(managedExternally.childNodes[0].nodeValue);
            } else {
                vm.managedExternally("");
            }
        }

        function getTagValue(spt, tagname) {
            return spt.getElementsByTagName(tagname)[0].childNodes[0].nodeValue;
        }

        function getTagAttribute(spt, tagname, attrname) {
            return spt.getElementsByTagName(tagname)[0].getAttribute(attrname);
        }

        function getTagNested(spt, tagname) {
            return spt.getElementsByTagName(tagname)[0].getElementsByTagName("Value")[0].childNodes[0].nodeValue;
        }

        function determinRequestType() {
            // TODO: Modify this
            vm.requestType(RequestType.UpdateSPT);
        }

        return vm;
    });