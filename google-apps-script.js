/**
 * Dennys Birthday — Google Apps Script
 * Paste this entire file into Extensions → Apps Script (inside the Google Sheet)
 * Then deploy as Web App (Anyone can access).
 */

const HEADERS = ['ID', 'Επώνυμο', 'Άτομα', 'Μήνυμα', 'Ημερομηνία'];

function getSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName('RSVPs');
  if (!sheet) {
    sheet = ss.insertSheet('RSVPs');
    sheet.appendRow(HEADERS);
    // Style header row
    const hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setBackground('#0057B8').setFontColor('white').setFontWeight('bold').setFontSize(11);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 280);
    sheet.setColumnWidth(5, 160);
  }
  return sheet;
}

// Called when the server POSTs a new RSVP
function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    // Deduplicate: remove existing row with same surname (case-insensitive)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const surnames = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
      for (let i = surnames.length - 1; i >= 0; i--) {
        if (surnames[i].toLowerCase() === (data.surname || '').toLowerCase()) {
          sheet.deleteRow(i + 2);
        }
      }
    }

    // Append new row
    const dt = new Date(data.submittedAt || Date.now());
    sheet.appendRow([
      data.id,
      data.surname,
      data.guests,
      data.message || '',
      Utilities.formatDate(dt, 'Europe/Athens', 'dd/MM/yyyy HH:mm')
    ]);

    // Alternate row shading
    const row = sheet.getLastRow();
    if (row % 2 === 0) {
      sheet.getRange(row, 1, 1, HEADERS.length).setBackground('#EEF4FF');
    }

    return ok({ added: data.surname });
  } catch (err) {
    return fail(err.message);
  }
}

// Called by GET /api/sync-to-sheet to bulk-sync all existing RSVPs
function doBulkSync(entries) {
  const sheet   = getSheet();
  // Clear data rows only (keep header)
  const last = sheet.getLastRow();
  if (last > 1) sheet.deleteRows(2, last - 1);

  entries.forEach((data, idx) => {
    const dt = new Date(data.submittedAt || Date.now());
    sheet.appendRow([
      data.id,
      data.surname,
      data.guests,
      data.message || '',
      Utilities.formatDate(dt, 'Europe/Athens', 'dd/MM/yyyy HH:mm')
    ]);
    const row = sheet.getLastRow();
    if (row % 2 === 0) {
      sheet.getRange(row, 1, 1, HEADERS.length).setBackground('#EEF4FF');
    }
  });
  return ok({ synced: entries.length });
}

// Route: POST with action=bulk → bulk sync, otherwise single RSVP
function doPostRouter(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'bulk') return doBulkSync(body.entries);
    return doPost(e);
  } catch (err) {
    return fail(err.message);
  }
}

function ok(data)   { return json({ ok: true,  ...data }); }
function fail(msg)  { return json({ ok: false, error: msg }); }
function json(obj)  {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
