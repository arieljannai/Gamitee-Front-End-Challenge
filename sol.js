let eventScriptsLoaded = new CustomEvent('scripts-loaded');
let server = null;
let storage = [];
let isGetDone = false, isPostDone = false;

// saving some elements to reduce the number of searches
let sequenceLength, lettersSequence, resultsStatsBlock,
    searchOptions, searchResults, previousSearches, previousSearchesSection,
    injectedSearchButton, countButton, resetButton, closeButton,
    dialog, modalDialog;

function handleGetResponse(data) {
    let dataToSave =
        {   sequence: storage[0]['lettersSequence'],
            found: storage[0]['result'],
            timesDone: data.length + 1,
            rank: data.filter(x => x > storage[0]['result']).length + 1
        };

    resultsStatsBlock.find('.sr-times-done-val').text(dataToSave.timesDone);
    resultsStatsBlock.find('.sr-rank-val').text(dataToSave.rank);

    storage[0] = dataToSave;
}

function handlePostResponse(data) {
    resultsStatsBlock.find('.sr-found-val').text(data);
}

function handleServerResponse(data) {
    switch (typeof(data)) {
        case 'number':
            handlePostResponse(data);
            isPostDone = true;
            break;
        case 'object':
            handleGetResponse(data);
            isGetDone = true;
            break;
        default:
            break;
    }

    if (isGetDone && isPostDone) {
        closeButton.removeClass('disabled');
        isGetDone = false;
        isPostDone = false;
    }
}

function updatePreviousSearches() {
    if (storage.length > 0) {
        previousSearchesSection.removeClass('hidden-no-space');
        let first = previousSearches.children().first();
        first = first.clone().insertBefore(first);
        first.find('.psr-sequence-val').first().text(storage[0].sequence);
        first.find('.psr-title > .psr-found-val').first().text(storage[0].found);
        first.find('.psr-title > .psr-times-done-val').first().text(storage[0].timesDone);
        first.find('.psr-title > .psr-rank-val').first().text(storage[0].rank);
        first.removeClass('hidden-no-space');
    } else {
        previousSearchesSection.addClass('hidden-no-space');
    }
}

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
            $.fn.replaceClass = replaceClass;
            $.fn.classAddRemove = classAddRemove;
            document.dispatchEvent(eventScriptsLoaded);
            server = new FakeHttpRequest();
            server.onload = handleServerResponse;
        });
})();

document.addEventListener('scripts-loaded', () => {

    // Add search button and modal dialog to the current page
    if (!document.location.href.endsWith('modal.html')) {
        let buttonRootLocation =
            $(document.createElement('span')).appendTo($('h1').or('h2').or('body').first());
        injectedSearchButton =
            $(document.createElement('button'))
                .addClass(['injected-search-button', 'center-objects'])
                .appendTo(buttonRootLocation)
                .after(getModalHTMLContent());

        injectedSearchButton.on('click', () => {
            dialog.showModal();
        });
    }

    // saving some elements to reduce the number of searches
    // sequenceLength = 0;
    lettersSequence = $('#lettersSequence');
    resultsStatsBlock = $('.search-results > .sr-right > .sr-title');
    searchOptions = $('.search-options');
    searchResults = $('.search-results');
    previousSearches = $('#previous-searches > ol');
    previousSearchesSection = $('.previous-search-section');
    countButton = $('#countSequence');
    resetButton = $('#resetForm');
    closeButton = $('#closeDialog');
    dialog = document.getElementById('dialog');
    modalDialog = $(dialog);

    lettersSequence.trigger('focus');

    modalDialog.on('close', () => {
       resetButton.trigger('click');
    });

    resetButton.on('click', () => {
        console.log('reset');
        lettersSequence.trigger('focus');

        lettersSequence.removeClass('disabled');
        resetButton.removeClass('disabled');
        resetButton.removeClass('hidden-no-space');
        closeButton.addClass('hidden-no-space');
        searchResults.addClass('invisible');
        searchOptions.replaceClass('invisible', 'disabled');
        countButton.replaceClass('hidden-no-space', 'disabled');

        resultsStatsBlock.find('.sr-times-done-val, .sr-rank-val, .sr-found-val')
            .each(function() { $(this).text('__'); });

        countButton.removeData();
    });

    $('input').on('load input change', () => {
        // enable/disable count button and search options
        sequenceLength = $('#lettersSequence').val().length;
        searchOptions.classAddRemove(sequenceLength <= 0, 'disabled');
        countButton.classAddRemove(!isFormValid(), 'disabled');
    });

    lettersSequence.on('load input change', (e) => {
        sequenceLength = $('#lettersSequence').val().length;
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
        if (isFormValid(true)) {
            countButton.addClass('disabled');
            searchOptions.addClass('disabled');
            lettersSequence.addClass('disabled');
            resetButton.addClass('disabled');

            countButton.addClass('hidden-no-space');
            resetButton.addClass('hidden-no-space');
            closeButton.replaceClass('hidden-no-space', 'disabled');

            searchOptions.addClass('invisible');
            searchResults.removeClass('invisible');

            storage.unshift(countButton.data());

            let searchResult = search();
            storage[0]['result'] = searchResult;

            server.open('GET');
            server.send(searchResult);

            server.open('POST');
            server.send(searchResult);
        }

        e.preventDefault();
    });

    closeButton.on('click', () => {
        updatePreviousSearches();
    })
});

function request(method, data) {
    server.open(method);
    server.send(data);
}

function search() {
    // let currSearch = storage[0];
    return Math.floor(Math.random() * 100);
}

function isFormValid(alert) {
    let isValid = true;
    for (let obj of dialog.getElementsByTagName('input')) {
        if (obj['required']) {
            isValid &= alert ? obj.reportValidity() : obj.checkValidity();
        }
    }

    return isValid;
}

// jQuery additions

function classAddRemove(toAdd, name) {
    if (toAdd) { this.addClass(name); }
    else { this.removeClass(name); }
    return this;
}

function replaceClass(remove, add) {
    this.removeClass(remove);
    this.addClass(add);
    return this;
}