let eventScriptsLoaded = new CustomEvent('scripts-loaded');

function insertScript(src){
    return new Promise(resolve => {
        let script = document.createElement("script");
        script.src = src;
        document.head.appendChild(script);
        script.onload = resolve;
    });
}

(function(){
    let jqueryLoad = insertScript("https://code.jquery.com/jquery-3.3.1.min.js");
    let fakeServerLoad = insertScript("./FakeServer.js");
    let modalHtml = insertScript('./modal.js');

    Promise.all([jqueryLoad, fakeServerLoad, modalHtml])
        .then(() => {
            $.fn.or = function(jObj) { return (this.length ? this : $(jObj)); };
            document.dispatchEvent(eventScriptsLoaded);
        });
})();

document.addEventListener('scripts-loaded', () => {

    // Add search button and modal dialog to the current page
    let buttonRootLocation = $(document.createElement('span')).appendTo($('h1').or('h2').or('body').first());
    let injectedSearchButton =
        $(document.createElement('button'))
            .addClass(['injected-search-button', 'center-objects'])
            .appendTo(buttonRootLocation)
            .after(getModalHTMLContent());

    let sequenceLength = 0;
    let lettersSequence = $('#lettersSequence');
    let searchOptions = $('.search-options');
    let countButton = $('#countSequence');
    let resetButton = $('#resetForm');
    let dialog = document.getElementById('dialog');
    let modalDialog = $(dialog);

    injectedSearchButton.on('click', () => {
        console.log(dialog);
        dialog.showModal();
    });

    modalDialog.on('close', () => {
       resetButton.trigger('click');
    });

    resetButton.on('click', () => {
        lettersSequence.trigger('focus');
        searchOptions.addClass('disabled');
        countButton.addClass('disabled');
        countButton.removeData();
    });

    lettersSequence.trigger('focus').on('load input change', (e) => {
        sequenceLength = $('#lettersSequence').val().length;

        if (sequenceLength > 0) {
            searchOptions.removeClass('disabled');
            countButton.removeClass('disabled');
        } else {
            searchOptions.addClass('disabled');
            countButton.addClass('disabled');
        }

        $('#stringPermutationLengthField').prop('max', sequenceLength);
        countButton.data(e.target.id, e.target.value);
    });

    $('#stringPermutationLengthField').on('input', (e) => {
        let t = e.target;
        return (!t.validity.rangeOverflow || (t.value = sequenceLength)) &&
                (!t.validity.rangeUnderflow || (t.value = 1)) &&
                (!t.validity.badInput || (t.value = sequenceLength));
    });

    $('input[name=sequenceToCounts], input[name=partsToCounts], #stringPermutationLengthActive, #stringPermutationLengthField').on('change', (e) => {
        console.log(e.target.type);
        switch (e.target.type) {
            case 'radio':
                countButton.data(e.target.name, e.target.value);
                break;
            case 'checkbox':
                countButton.data(e.target.id, e.target.checked);
                break;
            case 'number':
                countButton.data(e.target.id, e.target.value);
                break;
            default:
                break;
        }
    });

    countButton.on('click', (e) => {
        let t = e.target;
        let isFormValid = true;
        for (let obj of document.getElementsByTagName('input')) {
            if (obj['required']) {
                isFormValid &= obj.reportValidity();
            }
        }

        if (isFormValid) {
            console.log($(t).data());
            // TODO: send to server
        }

        e.preventDefault();
    });
});


