function Chat()
{
    return (
        <div>
            <div className="ui container">
                <h2 className="ui header">AI Chat</h2>
                <div className="chat-container">
                    <div className="message user">
                        <div className="content">Hello!</div>
                    </div>
                    <div className="message ai">
                        <div className="content">Hello, I am your AI 3D designer. What can I create for you today?
                        </div>
                    </div>
                    <div className="message user">
                    <div className="content">Can you create a 3d model of a candle stand?</div>
                    </div>
                    <div className="message ai">
                        <div className="content">Sure! let me create the model for you. This may take about one minute...
                        </div>
                    </div>
                    <div className="message ai">
                        <div className="content">This is what I created for you, do you like it?
                            <div className="response-3dmodel">
                                <img className="response-image" src="images/candleStand.png" alt="3d model" />
                            </div>
                            <div className="response-actions">
                                <i className="thumbs up outline icon"></i>
                                <i className="thumbs down outline icon"></i>
                                <i className="refresh icon"></i>
                            </div>  
                        </div>
                    </div>
                    <div className="message user">
                        <div className="content">Yes! can I please have an STL file of this?</div>
                    </div>
                    <div className="message ai">
                        <div className="content">Sure! let me render the STL for you. This may take between 1 and 5 minutes. You can also close the app and I'll notify you when it's ready.
                        </div>
                    </div>
                    <div className="message ai">
                        <div className="content">Your download of the candle stand is ready.
                            <div className="response-actions">
                                <a href="images/candleStand.stl" download="candleStand.stl" className="ui primary button">Download STL</a>
                            </div>
                        </div>
                    </div>   
                    <div className="message ai">
                        <div className="content">Can I do anything else for you?</div>
                    </div>            
                </div>
                <div className="input-container">
                    <div className="ui input input">
                        <input type="text" placeholder="Type a message..." />
                    </div>
                    <button className="ui primary button">Send</button>
                </div>
            </div>
        </div>
    );
}

export default Chat;