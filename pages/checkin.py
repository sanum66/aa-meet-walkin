import io
import streamlit as st
from PIL import Image

from database import Database
from utils import dataframe_from_records

try:
    from pyzbar.pyzbar import decode
    QR_DECODER_AVAILABLE = True
except ImportError:
    QR_DECODER_AVAILABLE = False


def render_checkin_page(db: Database):
    st.header("Search & Check-In")
    st.write("Lookup attendees instantly, review payment status, and complete check-in with one click.")

    search_text = st.text_input("Search by Mobile, Name or Attendee ID")
    search_button = st.button("Search Attendee")
    qr_upload = None
    qr_query = None

    if QR_DECODER_AVAILABLE:
        qr_upload = st.file_uploader("Upload QR code image for scan check-in", type=["png", "jpg", "jpeg"])

    attendee = None
    if qr_upload is not None and QR_DECODER_AVAILABLE:
        image = Image.open(io.BytesIO(qr_upload.read()))
        decoded = decode(image)
        if decoded:
            qr_query = decoded[0].data.decode("utf-8")
            st.success(f"Detected Attendee ID: {qr_query}")
            attendee = db.get_attendee(attendee_id=qr_query)
        else:
            st.warning("No QR code detected in the image.")

    if search_button and search_text.strip():
        attendee = db.get_attendee(attendee_id=search_text.strip())
        if not attendee:
            attendee = db.get_attendee(mobile=search_text.strip())
        if not attendee:
            attendee = db.get_attendee(full_name=search_text.strip())

    if attendee:
        status = "Checked In" if attendee["checked_in"] else "Pending"
        cols = st.columns([2, 2])
        with cols[0]:
            st.subheader(attendee["full_name"])
            st.write(f"**Attendee ID:** {attendee['attendee_id']}")
            st.write(f"**Batch:** {attendee['batch_year']}")
            st.write(f"**Department:** {attendee['department']}")
            st.write(f"**Mobile:** {attendee['mobile']}")
            st.write(f"**Email:** {attendee['email']}")
            st.write(f"**City:** {attendee['city']}")
            st.write(f"**Company:** {attendee['company']}")
        with cols[1]:
            st.write(f"**Registration:** {attendee['registration_type']}")
            st.write(f"**Payment Status:** {attendee['payment_status']}")
            st.write(f"**Payment Mode:** {attendee['payment_mode']}")
            st.write(f"**Amount Paid:** ₹{attendee['amount_paid']}")
            st.write(f"**Food Preference:** {attendee['food_preference']}")
            st.write(f"**Check-In Status:** {status}")
            if attendee["checked_in_at"]:
                st.write(f"**Checked In At:** {attendee['checked_in_at']}")

        if not attendee["checked_in"]:
            if st.button("Mark as Checked-In"):
                db.mark_checked_in(attendee["attendee_id"])
                st.success("Attendee has been checked in successfully.")
                st.experimental_rerun()
        else:
            st.info("This attendee has already been checked in.")

    elif search_button or qr_query:
        st.warning("No attendee record found for the provided search details.")
