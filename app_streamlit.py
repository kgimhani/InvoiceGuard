import streamlit as st

st.title("InvoiceGuard")

st.write("Upload invoice text or file")

uploaded_file = st.file_uploader("Choose a file")

if uploaded_file:
    st.success("File uploaded successfully")
    st.write("Prediction: (your model output here)")
