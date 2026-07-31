import streamlit as st
import requests

# App title and configuration
st.set_page_config(page_title="IMDB Chatbot", page_icon="🤖")
st.title("🤖 Pankaj's movie assistant")

# API Configuration
API_URL = "https://4c12dcdtlk.execute-api.ap-south-1.amazonaws.com/chat"

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Accept user input
if prompt := st.chat_input("Ask me anything about top 1000 imdb movies..."):
    # Display user message in chat message container
    with st.chat_message("user"):
        st.markdown(prompt)
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Display assistant response in chat message container
    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        
        try:
            # Prepare payload matching your curl command
            payload = {"query": prompt}
            headers = {"Content-Type": "application/json"}
            
            # Make the POST request
            response = requests.post(API_URL, json=payload, headers=headers)
            
            if response.status_code == 200:
                # Parse JSON and isolate the 'response' field
                data = response.json()
                api_response = data.get("response", "Error: No response field found.")
                
                # Render the clean text response
                response_placeholder.markdown(api_response)
                st.session_state.messages.append({"role": "assistant", "content": api_response})
            else:
                error_msg = f"API Error: Received status code {response.status_code}"
                response_placeholder.error(error_msg)
                
        except Exception as e:
            response_placeholder.error(f"Failed to connect to API: {str(e)}")
