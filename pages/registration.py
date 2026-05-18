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
    render_payment_section
)


def render_registration_page(db):

    st.header("Walk-In Registration")

    st.write(
        "Register new attendees instantly and collect membership/contribution."
    )

    with st.form("walkin_registration_form"):

        # Personal Information Section
        with st.container():
            st.subheader("📋 Personal Information")

            col1, col2 = st.columns(2)

            with col1:

                full_name = st.text_input(
                    "Full Name *"
                )

                batch_year = st.selectbox(
                    "Batch Year",
                    BATCH_YEARS
                )

                department = st.selectbox(
                    "Department",
                    DEPARTMENTS
                )

            with col2:

                mobile = st.text_input(
                    "Mobile Number *"
                )

                email = st.text_input(
                    "Email ID"
                )

                city = st.text_input(
                    "City"
                )

        st.markdown("---")

        # Professional Information
        with st.container():
            st.subheader("💼 Professional Information")

            col1, col2 = st.columns(2)

            with col1:

                company = st.text_input(
                    "Company / Profession"
                )

                food_preference = st.selectbox(
                    "Food Preference",
                    FOOD_PREFERENCES
                )

            with col2:

                payment_mode = st.selectbox(
                    "Payment Mode",
                    PAYMENT_MODES
                )

        st.markdown("---")

        # Contribution Section
        with st.container():
            st.subheader("💰 Contribution Details")

            payment_data = render_payment_section(
                MEMBERSHIP_OPTIONS,
                section_key="registration"
            )

            membership_amount = payment_data["membership_amount"]
            contribution_amount = payment_data["contribution_amount"]
            total_amount = payment_data["total_amount"]

        st.markdown("---")

        # Remarks
        with st.container():
            remarks = st.text_area(
                "Remarks",
                height=80
            )

        # Submit Button
        st.markdown("")
        col1, col2, col3 = st.columns([1, 2, 1])

        with col2:
            submitted = st.form_submit_button(
                "✅ Register & Check-In",
                use_container_width=True
            )

    # Process Registration
    if submitted:

        # Validation
        if (
            not full_name.strip()
            or not mobile.strip()
        ):

            st.error(
                "❌ Full Name and Mobile Number are mandatory."
            )

            return

        # Check for duplicate mobile
        existing = db.get_attendee(
            mobile=mobile.strip()
        )

        if existing:

            st.error(
                "❌ Mobile number already registered."
            )

            return

        # Generate attendee ID
        attendee_id = generate_attendee_id(
            full_name,
            mobile
        )

        # Prepare attendee data
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

            "registration_type": "Walk-In",

            "payment_status": "Paid",

            "payment_mode": payment_mode,

            "amount_paid": total_amount,

            "membership_amount": membership_amount,

            "contribution_amount": contribution_amount,

            "remarks": remarks.strip(),

            "checked_in": True,

        }

        # Save to database
        result = db.insert_attendee(attendee)

        if result:

            db.mark_checked_in(attendee_id)

            st.success(
                "✅ Registration completed successfully!"
            )

            st.markdown(f"**Attendee ID:** `{attendee_id}`")

            col1, col2, col3 = st.columns([1, 1, 1])

            with col2:
                st.metric("Membership", f"₹{membership_amount}")

            with col1:
                st.metric("Contribution", f"₹{contribution_amount}")

            with col3:
                st.metric("Total Collected", f"₹{total_amount}")

            st.balloons()

        else:

            st.error(
                "❌ Registration failed. Please try again."
            )
