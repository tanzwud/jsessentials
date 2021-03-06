console.log('Starting notes.js');

const Promise = require("bluebird");
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');

let fetchNotes = (file) => {
    return new Promise((resolve, reject) => {
        fs.readFileAsync(`${__dirname}/${file}`, 'utf8').then((data) => {
            data ? resolve(JSON.parse(data)) : [];
        },
            (err) => { console.log('Error'); }
        )
    })
};

let saveNotes = (file) => {
    return (notes) => {
        return new Promise((resolve, reject) => {
            fs.writeFileAsync(`${__dirname}/${file}`, JSON.stringify(notes, null, 2), 'utf8', (err) => {
                if (err) reject(err);
                else resolve(JSON.stringify(notes, null, 4));
            });
        })
    };
};

let addNote = (title, body) => {
    let note = {
        title,
        body
    };
    let result = [];
    return fetchNotes('notes.json').then((data) => {
        // filter notes
        let duplicates = data.filter((note) => {
            return note.title === title;
        });
        if (duplicates.length > 0) {
            throw Error('duplicate note found');
        }
        return data;
    }).then((data) => {
        data.push(note);
        return data;
    }).then(saveNotes('notes.json')).then((json) => {
        if (json) {
            console.log('Succeed');
        } else {
            console.log('No data written');
        }
        return note;
    }).catch((err) => {
        throw err;
    });
};

let getAll = () => {
    return fetchNotes('notes.json').then((data) => {
        if (data.length) {
            return data;
        } else {
            throw Error('Notes not FOUND');
        }
    }).catch((err) => {
        throw err;
    });
};

let getNote = (title) => {
    return fetchNotes('notes.json').then((data) => {
        return _.filter(data, ['title', title]);
    }).then((data) => {
        if (data.length) {
            return data[0];
        } else {
            throw Error('Note not FOUND');
        }
    }).catch((err) => {
        throw err;
    });
};

let remove = (title) => {
    return fetchNotes('notes.json').then((data) => {
        // filter
        if (_.filter(data, ['title', title]).length === 0) {
            throw Error('Note not FOUND');
        }
        return _.filter(data, (o) => { return o.title !== title });
    }).then(saveNotes('notes.json')).then((data) => {
        return title;
    }).catch((err) => {
        throw err;
    });

};

module.exports = {
    addNote: addNote,
    getAll: getAll,
    getNote: getNote,
    remove: remove
}
