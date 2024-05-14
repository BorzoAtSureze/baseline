declare var signalR;

//function PreventFormSubmitOnEnter() {
//    $(document).on("keydown", "form", function (event) {
//        return event.key != "Enter";
//    });
//}

function onImageBabyHeadClicked(ev: JQueryEventObject, babyId: string) {
    //console.log(ev)

    let circle = document.getElementById("circle" + babyId + "");

    circle.style.left = ev["layerX"] - circle.clientWidth / 2 + "px";
    circle.style.top = ev["layerY"] - circle.clientHeight / 2 + "px";
    circle.style.display = "block";

    if (globalDotNetObjectReferenceComponent)
        globalDotNetObjectReferenceComponent.invokeMethodAsync("OnGetBabyHeadClientXYLocation", ev["layerX"].toString(), ev["layerY"].toString());

}

function RemoveCircleBabyHead(babyId: string) {

    let circle = document.getElementById("circle" + babyId + "");
    circle.style.display = "none";
}

function SetBabyHeadIconLocation(clientX, clientY, babyId) {

    let circle = document.getElementById("circle" + babyId + "");
    circle.style.left = clientX - circle.clientWidth / 2 + "px";
    circle.style.top = clientY - circle.clientHeight / 2 + "px";
    circle.style.display = "block";
}

function EnableAllTheFieldsInLaborNotesBody(className) {
    let divInputs = $('.' + className);

    // Find all inputs within the div
    let inputs = divInputs.find(':input').not('#ObstetricGynaeMedicalRecord');

    inputs.prop('disabled', false);
}
function DisableAllTheFieldsInLaborNotesBody(className) {
    let divInputs = $('.' + className);

    // Find all inputs within the div
    let inputs = divInputs.find(':input');

    inputs.prop('disabled', true);
}

function OnResizeLaborNotesCard() {

    //in table resize mishe 
    var table = $("#LaborNotesCard");

    var currentWidth = table.width();
    var currentHeight = table.height();
    var currentTop = parseInt(table.css("top").replace('px', ''))

    $('#ProcedureDateCard').css({ top: currentTop + currentHeight - 2 });

    const resizeObserver = new ResizeObserver((entries) => {


        console.log("Table has been resized")

        // Update the current dimensions
        ResetProcedureDateCardTop();

    });

    resizeObserver.observe(table[0])



}

function ResetProcedureDateCardTop() {

    var table = $("#LaborNotesCard");
    const currentHeight = table.height();
    const currentTop = parseInt(table.css("top").replace('px', ''));

    // Perform actions as needed
    $('#ProcedureDateCard').css({ top: currentTop + currentHeight - 2 });

}

function ClickCollapseIcon() {
    $('.menu-collapse-icon').click(function () {

    });
}

function AddFormControlAndSm() {

    //if (!$('.form-control').hasClass('form-control-sm')) {
    //    // Add the class 'exampleClass' to the element
    //    $('.form-control').addClass('form-control-sm');
    //}

    //if (!$('.form-select').hasClass('form-select-sm')) {
    //    // Add the class 'exampleClass' to the element
    //    $('.form-select').addClass('form-select-sm');
    //}


    $(".form-control").addClass("form-control-sm");
    $(".form-select").addClass("form-select-sm");
}

function triggerFileDownload(fileName, url) {

    const anchorElement = document.createElement('a');
    anchorElement.href = url;
    anchorElement.download = fileName || '';
    anchorElement.click();
    anchorElement.remove();
}

async function downloadFileFromStream(fileName, contentStreamReference) {
    const arrayBuffer = await contentStreamReference.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);
    const anchorElement = document.createElement('a');
    anchorElement.href = url;
    anchorElement.download = fileName ?? '';
    anchorElement.click();
    anchorElement.remove();
    URL.revokeObjectURL(url);
}

function GetIconClassInSpecimenOrders(coutner) {
    if ($("#PlusIcon" + coutner).length) {
        return true;
    }
    else {

        return false;
    }
}

function GetIconSubClassInSpecimenOrders(coutner) {
    if ($("#PlusIconSub" + coutner).length) {
        return true;
    }
    else {

        return false;
    }
}

function ShowFileAndClearFileButtonInEditMode(counterButton) {
    $("#" + "fileEditId" + counterButton).css("display", "");
    $("#" + "buttonEditId" + counterButton).css("display", "");
    $("#" + "downloadButtonId" + counterButton).css("display", "");
}

function DeleteFileAndClearFileButtonInEditMode(counterButton) {
    $("#" + "fileEditId" + counterButton).css("display", "none");
    $("#" + "buttonEditId" + counterButton).css("display", "none");
    $("#" + "downloadButtonId" + counterButton).css("display", "none");
}

function DeleteFileAndClearFileButton(counterButton) {

    $("#" + "buttonId" + counterButton).css("display", "none");
    $("#" + "fileId" + counterButton).css("display", "none");
}

function CreateIsDefaultIndicator() {

    var checked = $('.isDefaultIndicatorCreateCheckBox').prop('checked');

    if (checked) {
        $('.isDefaultIndicatorCreateErrorMessage').append('<div class="text-danger">By selecting this, you are making it as default selection, if you are sure hit create, if not unselect this</div>');
    }
    else {
        $('.isDefaultIndicatorCreateErrorMessage').empty();
    }

}

function EditIsDefaultIndicator() {


    var checked = $('.isDefaultIndicatorEditCheckBox').prop('checked');

    if (checked) {
        $('.isDefaultIndicatorEditErrorMessage').append('<div class="text-danger">By selecting this, you are making it as default selection, if you are sure hit create, if not unselect this</div>');
    }
    else {
        $('.isDefaultIndicatorEditErrorMessage').empty();
    }

}

function OnChangeInActiveStatusSelectBoxIsInActiveDeceased() {

    $("#InActiveReasonDiv").css('display', 'none');
    $("#InActiveReasonDiv").css('visibility', 'visible');


    $("#DeceasedEncounterDiv").css('display', '');
    $("#DeceasedDateTimeDiv").css('display', '');



    $("#DeceasedEncounterDiv").css('visibility', 'visible');
    $("#DeceasedDateTimeDiv").css('visibility', 'visible');

    /* $("#InActiveReason").val('Choose An Option');*/

}

function OnChangeInActiveStatusSelectBoxIsInActive() {
    $("#InActiveReasonDiv").css('display', '');
    $("#InActiveReasonDiv").css('visibility', 'visible');

    $("#DeceasedEncounterDiv").css('display', 'none');
    $("#DeceasedDateTimeDiv").css('display', 'none');

    $("#DeceasedEncounterDiv").css('visibility', 'hidden');
    $("#DeceasedDateTimeDiv").css('visibility', 'hidden');

    //$("#DeceasedEncounter").val('');
    //$("#DeceasedDateTime").val('');

}

function OnChangeInActiveStatusSelectBoxIsActive() {

    //$("#InActiveReason").val('Choose An Option');
    //$("#DeceasedEncounter").val('');
    //$("#DeceasedDateTime").val('');

    $("#InActiveReasonDiv").css('display', 'none');
    $("#DeceasedEncounterDiv").css('display', 'none');
    $("#DeceasedDateTimeDiv").css('display', 'none');


    $("#InActiveReasonDiv").css('visibility', 'hidden');
    $("#DeceasedEncounterDiv").css('visibility', 'hidden');
    $("#DeceasedDateTimeDiv").css('visibility', 'hidden');
}

function OnChangeDatagridIconToMinusInSpecimenOrders(coutner) {
    $("#DatagridRowTrigger").html('');
    $("#DatagridRowTrigger" + coutner).html('<i class="fas fa-minus" aria-hidden="true"></i>');
}

function OnChangeDatagridIconToPlusInSpecimenOrders(coutner) {
    $("#DatagridRowTrigger").html('');
    $("#DatagridRowTrigger" + coutner).html('<i id="PlusIcon' + coutner + '" class="fas fa-plus"></i>');
}


function OnChangeDatagridSubIconToMinusInSpecimenOrders(coutner) {
    $("#DatagridSubRowTrigger").html('');
    $("#DatagridSubRowTrigger" + coutner).html('<i class="fas fa-minus" aria-hidden="true"></i>');
}

function OnChangeDatagridSubIconToPlusInSpecimenOrders(coutner) {
    $("#DatagridSubRowTrigger").html('');
    $("#DatagridSubRowTrigger" + coutner).html('<i id="PlusIconSub' + coutner + '" class="fas fa-plus"></i>');
}

function ScrollToFirstError() {

    delay(500).then(() => {

        var element = document.getElementsByClassName("is-invalid")[0];
        if (element != null) {
            window.scrollTo(0, element.parentElement.offsetTop)
            //element.parentNode.scrollIntoView(true);

            $(element).focus();

            // element.parentNode.focus();

        }

    });
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function ResetAutoCompleteValue(id) {

    var autoComplete = $('#' + id).find('input[type="search"]').first();
    autoComplete.val('');
}

function AddPatientDetailsOnNavBar(patientFullName, age, gravidaParityMisscarriage, poa, bloodGroup, mrn, encounterNo, room, admissionStatus, riskLevel) {
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >Blood Group: ' + bloodGroup + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >POA: ' + poa + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >' + gravidaParityMisscarriage + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >MRN: ' + mrn + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >Risk Level: ' + riskLevel + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >Status: ' + admissionStatus + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >Labor Room: ' + room + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="lpx-topbar-content patientDetails" >Encounter No. : ' + encounterNo + '</div>')
    $(".lpx-topbar").prepend('<div style="font-size: 1rem;" class="ms-1 lpx-topbar-content patientDetails" >' + patientFullName + ' (' + age + ') </div>');
}

function RemovePatientDetailsOnNavBar() {
    $(".patientDetails").remove();
}

function AddMedicalHighlightToToolbar() {
    $(".lpx-topbar-content").prepend('<div id="MedicalHighlight" style="cursor:pointer" class="text-decoration-underline">Medical Highlight</div>');
}

function OnClickMedicalHighlightFromLaborNotesScreen() {
    $("#MedicalHighlight").on("click", function () {

        if (globalDotNetObjRef)
            globalDotNetObjRef.invokeMethodAsync("OnClickMedicalHighlightFromLaborNotesScreen");
    });
}

function RemoveMedicalHighlightFromToolbar() {
    $("#MedicalHighlight").remove();
}

function SwitchToFullScreen(goFullScreenWithoutCheckingResolution: boolean) {

    let el = document.documentElement;
    let rfs = null;

    if (goFullScreenWithoutCheckingResolution == false) {
        let ratio = window.devicePixelRatio || 1;
        let width = window.screen.width * ratio;

        if (width < 576) {
            if (document.fullscreenElement !== null) {
                document.exitFullscreen();
            }
            else {
                rfs = el.requestFullscreen;
            }
        }
    }
    else {
        if (document.fullscreenElement !== null) {
            document.exitFullscreen();
        }
        else {
            rfs = el.requestFullscreen;
        }

    }

    if (typeof rfs != "undefined" && rfs) {
        rfs.call(el);
    }

}


//function PrintAdmissionsListReport(id) {
//    printJS(
//        {
//            printable: id,
//            type: 'html',
//            header: 'Admissions Book',
//            showModal: true,
//       /*     style: '#myGrid {color:red;}',*/
//            targetStyles: ['*'],
//            maxWidth: 1000,
//      /*      style: '@page { size: Letter landscape; }'*/

//        });
//}


//window.ShowToastr = (type, message) => {
//    if (type == "success") {
//        toastr.success(message, "Operation Successfull", { timeOut: 10000 });
//    }
//    if (type == "error") {
//        toastr.error(message, "Operation Failed", { timeOut: 10000 });
//    }
//}

//window.PreventEnterKey = () => {
//    $(document).ready(function () {
//        $(window).keydown(function (event) {
//            if (event.keyCode == 13) {
//                event.preventDefault();
//                return false;
//            }
//        });
//    });
//};

//function PreventEnterAndTabKeyForTestAutoComplete()
//{
//    $('#TestAutoComplete').keydown(function (event) {
//        if (event.keyCode == 13 || event.keyCode == 9)
//        {
//            event.preventDefault();
//        }
//    });
//}


/////////////  Document Visibility

$(function () {
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {

            console.log("Browser tab is hidden");
        } else {
            console.log("Browser tab is visible");
        }
        documentVisibilityChanged(!document.hidden);
    });
    // setRoomTogglerEvents();



});

var roomCodeClicked: string[] = [];
var dropdownShown;
function setRoomTogglerEvents() {
    setTimeout(() => {
        if (!$('.room-dropdown-toggler').length) {
            setRoomTogglerEvents();
        } else {
            $('.room-dropdown-toggler').click(ev => {
                var dropdownMenu = ev.target.parentElement.getElementsByClassName('dropdown-menu');
                if (dropdownMenu.length) {
                    var dropdown = new bootstrap.Dropdown(ev.target);
                    var selected = ev.target.firstElementChild.classList.contains("room-selected");
                    if (selected || !dropdownMenu[0].children.length) {
                        dropdown.hide();
                        roomCodeClicked = roomCodeClicked.filter(k => k != ev.target.getAttribute("data-room"));
                        if (roomCodeClicked.length) {
                            var dropdown2 = new bootstrap.Dropdown($(`.room-dropdown-toggler[data-room="${roomCodeClicked[roomCodeClicked.length - 1]}"]`)[0]);


                            dropdown2.show();
                            dropdownShown = dropdown2;

                        } console.log(roomCodeClicked);
                    }
                    else {
                        if (dropdownShown) dropdownShown.hide();
                        dropdown.show();
                        dropdownShown = dropdown;
                        roomCodeClicked.push(ev.target.getAttribute("data-room"));
                        console.log(roomCodeClicked);
                    }
                }
            });


            $('body').click(ev => {
                var isRoomElement = ev.target.classList.contains('room-dropdown-toggler');
                if (!isRoomElement) $('.room-dropdown-toggler .room-selected').parent().click();
            });
        }


    }, 500);
}

var globalDotNetObjRef;
var globalDotNetObjectReferenceComponent;

function documentVisibilityChanged(visible: boolean) {
    console.log("documentVisibilityChanged");
    if (globalDotNetObjRef)
        globalDotNetObjRef.invokeMethodAsync("DocumentVisibilityChanged", visible);
}

function RegisterGlobalDotNetObjectReference(dotNetObjRef) {
    console.log("RegisterGlobalDotNetObjectReference");
    globalDotNetObjRef = dotNetObjRef;

}

function RegisterGlobalDotNetObjectReferenceComponent(dotNetObjRefComponent) {

    globalDotNetObjectReferenceComponent = dotNetObjRefComponent;

}


async function CreateNewTask(data: Dictionary<any>) {
    var taskId: string = null;
    if (globalDotNetObjRef)
        taskId = await globalDotNetObjRef.invokeMethodAsync("CreateNewTask", data);
    return taskId;
}


interface ITask {
    id: string,
    data: Dictionary<any>
}
interface ITaskProgressEventArgs {
    taskId: string,
    value: number,
    total: number
}

var TaskSignalrConnection;
async function initializeTasksSignalR() {
    TaskSignalrConnection = new signalR.HubConnectionBuilder().withUrl("/tasks-hub").build();
    await TaskSignalrConnection.start();


}


interface ITaskEventDictionary {
    ProgressChanged?(eventArgs: ITaskProgressEventArgs): Promise<void>;
    TaskFinished?(eventArgs: ITaskProgressEventArgs): Promise<void>;
    TaskCanceled?(taskId: string): Promise<void>;
};

async function RegisterInTaskEvent(taskId: string, events: ITaskEventDictionary) {
    if (TaskSignalrConnection) {
        for (var i in events) {
            TaskSignalrConnection.on(i, events[i]);
        }
        await TaskSignalrConnection.invoke("RegisterConnection", taskId)
    }
}
async function CancelTask(taskId: string) {
    if (!TaskSignalrConnection) {
        await initializeTasksSignalR();
    }
    try {
        await TaskSignalrConnection.invoke("CancelTask", taskId);

    } catch (e) {
        console.error(e);
    }

}
async function ChangeTaskProgress(eventArgs: ITaskProgressEventArgs) {
    if (!TaskSignalrConnection) {
        await initializeTasksSignalR();
    }
    try {

        await TaskSignalrConnection.invoke("ChangeProgress", eventArgs);

    } catch (e) {
        console.error(e);
    }

}


// async function unzipBlob(a: ArrayBuffer, l: number) {
//     var bb = a.slice(0, l);
//     var pp = a.slice(l);
//     var b = new Blob([bb]);

//     var blobReader = new zip.BlobReader(b);

//     var zipReader = new zip.ZipReader(blobReader, {
//         password: new TextDecoder().decode(new Uint8Array(pp))
//     });
//     var entries = await zipReader.getEntries();

//     if (entries && entries.length) {

//         var files: { entry: zip.Entry, content: string }[] = [];
//         for (var i in entries) {
//             var entry = entries[i];
//             const textWriter = new zip.TextWriter();

//             files.push({ entry, content: await entry.getData(textWriter) });
//         }


//         return files;
//     }
//     return null;
// }



interface Dictionary<TValue> { [key: string]: TValue }


class ProgressService {
    static async GO(percentage: number, type: UiPageProgressType) {

        if (globalDotNetObjRef)
            await globalDotNetObjRef.invokeMethodAsync("ProgressService_GO", percentage, type)
    }
}

enum UiPageProgressType {
    Default,
    Info,
    Success,
    Warning,
    Error
}

function svg2img(svg: SVGElement) {


    var xml = new XMLSerializer().serializeToString(svg);

    // method 1
    //var blob = new Blob([xml], { type: 'image/svg+xml' });
    //var url = URL.createObjectURL(blob);
    //return url;

    //method 2
    var svg64 = btoa(unescape(encodeURIComponent(xml)))
    var b64start = 'data:image/svg+xml;base64,';
    var image64 = b64start + svg64;
    return image64;
}