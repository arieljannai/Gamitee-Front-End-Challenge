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

    // saving some elements to reduce the number of searches
    let sequenceLength = 0;
    let lettersSequence = $('#lettersSequence');
    let searchOptions = $('.search-options');
    let searchResults = $('.search-results');
    let countButton = $('#countSequence');
    let resetButton = $('#resetForm');
    let closeButton = $('#closeDialog');
    let dialog = document.getElementById('dialog');
    let modalDialog = $(dialog);

    // Add search button and modal dialog to the current page
    if (!document.location.href.endsWith('modal.html')) {
        let buttonRootLocation =
            $(document.createElement('span')).appendTo($('h1').or('h2').or('body').first());
        let injectedSearchButton =
            $(document.createElement('button'))
                .addClass(['injected-search-button', 'center-objects'])
                .appendTo(buttonRootLocation)
                .after(getModalHTMLContent());

        injectedSearchButton.on('click', () => {
            console.log(dialog);
            dialog.showModal();
        });
    }

    modalDialog.on('close', () => {
       resetButton.trigger('click');
    });

    resetButton.on('click', () => {
        lettersSequence.trigger('focus');
        searchOptions.addClass('disabled');
        countButton.addClass('disabled');

        closeButton.addClass('hidden-no-space');
        countButton.removeClass('hidden-no-space');

        searchResults.addClass('invisible');
        searchOptions.removeClass('invisible');

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

    $('input[name=sequenceToCounts], input[name=partsToCounts], #stringPermutationLengthActive, #stringPermutationLengthField')
        .on('change', (e) => {

        switch (e.target.type) {
            case 'checkbox':
                countButton.data(e.target.id, e.target.checked);
                break;
            case 'number':
                countButton.data(e.target.id, e.target.value);
                break;
            case 'radio':
                countButton.data(e.target.name, e.target.value);
                break;
            default:
                break;
        }

        if (e.target.name === 'partsToCounts') {
            let radioId = $('input[name=partsToCounts]:checked').attr('id');
            let newText = $('label[for=' + radioId + ']').text();
            $('.search-results *> .sr-count-in-val').text(newText);
        } else {         // If the sequence type or length was changed
            let radioId = $('input[name=sequenceToCounts]:checked').attr('id');
            let newText = $('label[for=' + radioId + ']').text();

            if (radioId === 'stringPermutation' && countButton.data('stringPermutationLengthActive')) {
                let permLength = countButton.data('stringPermutationLengthField') || 1;
                newText += ' (' +  permLength + ')';
            }

            $('.search-results *> .sr-scheme-chosen-val').text(newText);
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
            countButton.addClass('hidden-no-space');
            closeButton.removeClass('hidden-no-space');

            searchOptions.addClass('invisible');
            searchResults.removeClass('invisible');

            // TODO: send to server
        }

        e.preventDefault();
    });
});

function addClass(className, ...objects) {
    objects.forEach(o => o.addClass(className));
}
