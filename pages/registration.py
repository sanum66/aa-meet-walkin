import streamlit as st

from constants import (
    BATCH_YEARS,
    DEPARTMENTS,
    MEMBERSHIP_OPTIONS,
    PAYMENT_MODES,
    FOOD_PREFERENCES
)

from utils import (
    generate_attendee_id,
    generate_qr_code
)


# ---------------------------------------------------
# WALK-IN REGISTRATION PAGE
# ---------------------------------------------------

def render_registration_page(db):

    st.header("Walk-In Registration")

    st.write(
        "Register new attendees instantly "
        "and generate QR-based entry."
    )

    # ---------------------------------------------------
    # FORM
    # ---------------------------------------------------

    with st.form("walkin_registration_form"):

        col1, col2 = st.columns(2)

        # -----------------------------------------------
        # LEFT
        # -----------------------------------------------

        with col1:

            full_name = st.text_input(
                "Full Name"
            )

            batch_year = st.selectbox(
                "Batch Year",
                BATCH_YEARS
            )

            department = st.selectbox(
                "Department",
                DEPARTMENTS
            )

            mobile = st.text_input(
                "Mobile Number"
            )

            email = st.text_input(
                "Email ID"
            )

        # -----------------------------------------------
        # RIGHT
        # -----------------------------------------------

        with col2:

            city = st.text_input(
                "City"
            )

            company = st.text_input(
                "Company / Profession"
            )

            food_preference = st.selectbox(
                "Food Preference",
                FOOD_PREFERENCES
            )

            payment_mode = st.selectbox(
                "Payment Mode",
                PAYMENT_MODES
            )

        # ---------------------------------------------------
        # CONTRIBUTION SECTION
        # ---------------------------------------------------

        st.markdown("---")

        st.subheader("Contribution Details")

        contribution_amount = st.number_input(

            "Contribution Amount",

            min_value=0,

            step=100,

            value=0

        )

        membership_type = st.selectbox(

            "Membership",

            list(
                MEMBERSHIP_OPTIONS.keys()
            )

        )

        membership_amount = MEMBERSHIP_OPTIONS[
            membership_type
        ]

        total_amount = (

            contribution_amount
            + membership_amount

        )

        st.success(

            f"Total Collection: ₹{total_amount}"

        )

        # ---------------------------------------------------
        # REMARKS
        # ---------------------------------------------------

        remarks = st.text_area(
            "Remarks"
        )

        # ---------------------------------------------------
        # SUBMIT
        # ---------------------------------------------------

        submitted = st.form_submit_button(

            "Register & Check-In"

        )

    # ---------------------------------------------------
    # SAVE
    # ---------------------------------------------------

    if submitted:

        # -----------------------------------------------
        # VALIDATION
        # -----------------------------------------------

        if (

            not full_name.strip()

            or not mobile.strip()

        ):

            st.error(

                "Full Name and Mobile "
                "are mandatory."

            )

            return

        # -----------------------------------------------
        # DUPLICATE MOBILE CHECK
        # -----------------------------------------------

        existing = db.get_attendee(

            mobile=mobile.strip()

        )

        if existing:

            st.error(

                "Mobile number already registered."

            )

            return

        # -----------------------------------------------
        # ATTENDEE ID
        # -----------------------------------------------

        attendee_id = generate_attendee_id(

            full_name,

            mobile

        )

        # -----------------------------------------------
        # QR CODE
        # -----------------------------------------------

        qr_code_path = generate_qr_code(

            attendee_id

        )

        # -----------------------------------------------
        # FINAL DATA
        # -----------------------------------------------

        attendee = {

            "attendee_id": attendee_id,

            "name": full_name.strip(),

            "course": "",

            "stream": department,

            "batch_year": batch_year,

            "email": email.strip(),

            "mobile": mobile.strip(),

            "status": "Walk-In",

            "food_preference": food_preference,

            "family_members": 0,

            "gender": "",

            "city": city.strip(),

            "company": company.strip(),

            "registration_type": "Spot Registration",

            "payment_status": "Paid",

            "payment_mode": payment_mode,

            "amount_paid": total_amount,

            "remarks": remarks.strip(),

            "checked_in": True,

            "checked_in_at": None,

            "qr_code_path": qr_code_path,

        }

        # -----------------------------------------------
        # SAVE DATABASE
        # -----------------------------------------------

        result = db.insert_attendee(

            attendee

        )

        # -----------------------------------------------
        # SUCCESS
        # -----------------------------------------------

        if result:

            db.mark_checked_in(

                attendee_id

            )

            st.success(

                "Registration completed successfully."

            )

            st.markdown(

                f"### Attendee ID: {attendee_id}"

            )

            st.image(

                qr_code_path,

                width=220,

                caption="QR Code"

            )

            st.balloons()

        else:

            st.error(

                "Registration failed."

            )