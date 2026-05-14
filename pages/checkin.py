import io

import pandas as pd
import streamlit as st

from PIL import Image

from database import Database


# ---------------------------------------------------
# QR SUPPORT
# ---------------------------------------------------

try:

    from pyzbar.pyzbar import decode

    QR_DECODER_AVAILABLE = True

except ImportError:

    QR_DECODER_AVAILABLE = False


# ---------------------------------------------------
# MEMBERSHIP OPTIONS
# ---------------------------------------------------

MEMBERSHIP_OPTIONS = {

    "None": 0,

    "Life Member - ₹1000": 1000,

    "Patron Member - ₹5000": 5000,

    "Patron Upgrade - ₹4000": 4000,

}


# ---------------------------------------------------
# CHECK-IN PAGE
# ---------------------------------------------------

def render_checkin_page(db: Database):

    st.header("Search & Check-In")

    attendees = db.get_all_attendees()

    if not attendees:

        st.warning("No attendees found.")

        return

    df = pd.DataFrame(attendees)

    # ---------------------------------------------------
    # FILTERS
    # ---------------------------------------------------

    col1, col2, col3 = st.columns(3)

    with col1:

        batch_options = ["All"]

        for year in range(1988, 2028):

            batch_options.append(str(year))

        selected_batch = st.selectbox(

            "Filter by Batch",

            batch_options

        )

    with col2:

        search_name = st.text_input(

            "Search by Name"

        )

    with col3:

        search_mobile = st.text_input(

            "Search by Mobile"

        )

    # ---------------------------------------------------
    # FILTER DATA
    # ---------------------------------------------------

    filtered_df = df.copy()

    if selected_batch != "All":

        filtered_df = filtered_df[

            filtered_df["batch_year"]
            .astype(str)
            == selected_batch

        ]

    if search_name.strip():

        filtered_df = filtered_df[

            filtered_df["name"]
            .astype(str)
            .str.lower()
            .str.contains(
                search_name.lower(),
                na=False
            )

        ]

    if search_mobile.strip():

        filtered_df = filtered_df[

            filtered_df["mobile"]
            .astype(str)
            .str.contains(
                search_mobile,
                na=False
            )

        ]

    # ---------------------------------------------------
    # QR SEARCH
    # ---------------------------------------------------

    if QR_DECODER_AVAILABLE:

        qr_upload = st.file_uploader(

            "Upload QR Code",

            type=["png", "jpg", "jpeg"]

        )

        if qr_upload:

            image = Image.open(

                io.BytesIO(
                    qr_upload.read()
                )

            )

            decoded = decode(image)

            if decoded:

                qr_value = decoded[0].data.decode(
                    "utf-8"
                )

                filtered_df = filtered_df[

                    filtered_df["attendee_id"]
                    == qr_value

                ]

                st.success(

                    f"QR Detected: {qr_value}"

                )

    # ---------------------------------------------------
    # RESULTS
    # ---------------------------------------------------

    st.markdown("---")

    st.subheader(

        f"Results Found: {len(filtered_df)}"

    )

    # ---------------------------------------------------
    # NO RECORD
    # ---------------------------------------------------

    if filtered_df.empty:

        st.warning(

            "Attendee not found."

        )

        st.info(

            "Please proceed with Walk-In Registration."

        )

        return

    # ---------------------------------------------------
    # DISPLAY RESULTS
    # ---------------------------------------------------

    for _, attendee in filtered_df.iterrows():

        st.markdown("---")

        status = "Pending"

        if attendee["checked_in"]:

            status = "Checked-In"

        col_left, col_right = st.columns([2, 2])

        # ------------------------------------------------
        # LEFT PANEL
        # ------------------------------------------------

        with col_left:

            st.subheader(

                attendee["name"]

            )

            st.write(

                f"**Attendee ID:** "
                f"{attendee['attendee_id']}"

            )

            st.write(

                f"**Batch:** "
                f"{attendee['batch_year']}"

            )

            st.write(

                f"**Department:** "
                f"{attendee['stream']}"

            )

            updated_mobile = st.text_input(

                "Mobile",

                value=str(
                    attendee["mobile"]
                ),

                key=f"mobile_{attendee['attendee_id']}"

            )

            updated_email = st.text_input(

                "Email",

                value=str(
                    attendee["email"]
                ),

                key=f"email_{attendee['attendee_id']}"

            )

        # ------------------------------------------------
        # RIGHT PANEL
        # ------------------------------------------------

        with col_right:

            st.write(

                f"**Registration:** "
                f"{attendee['registration_type']}"

            )

            st.write(

                f"**Food Preference:** "
                f"{attendee['food_preference']}"

            )

            st.write(

                f"**Current Status:** "
                f"{status}"

            )

            # --------------------------------------------
            # CONTRIBUTION
            # --------------------------------------------

            contribution_amount = st.number_input(

                "Contribution Amount",

                min_value=0,

                step=100,

                value=0,

                key=f"contribution_{attendee['attendee_id']}"

            )

            # --------------------------------------------
            # MEMBERSHIP
            # --------------------------------------------

            membership_choice = st.selectbox(

                "Membership Fee",

                list(
                    MEMBERSHIP_OPTIONS.keys()
                ),

                key=f"membership_{attendee['attendee_id']}"

            )

            membership_amount = MEMBERSHIP_OPTIONS[
                membership_choice
            ]

            # --------------------------------------------
            # TOTAL
            # --------------------------------------------

            total_amount = (

                contribution_amount
                + membership_amount

            )

            st.success(

                f"Total Collection: ₹{total_amount}"

            )

        # ------------------------------------------------
        # CHECK-IN ACTION
        # ------------------------------------------------

        if not attendee["checked_in"]:

            if st.button(

                f"Check-In - {attendee['attendee_id']}",

                key=f"checkin_{attendee['attendee_id']}"

            ):

                db.update_attendee(

                    attendee["attendee_id"],

                    {

                        "mobile": updated_mobile,

                        "email": updated_email,

                        "amount_paid": total_amount,

                        "payment_status": "Paid",

                        "checked_in": True,

                    }

                )

                db.mark_checked_in(

                    attendee["attendee_id"]

                )

                st.success(

                    f"{attendee['name']} checked in successfully."

                )

                st.rerun()

        else:

            st.success(

                "Already Checked-In"

            )