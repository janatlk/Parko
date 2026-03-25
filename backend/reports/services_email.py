"""
Email sending service for report sharing
"""
import logging
from typing import Optional
from io import BytesIO

logger = logging.getLogger(__name__)


def send_report_email(
    recipient_email: str,
    report_file: BytesIO,
    report_name: str,
    sender_email: str,
    api_key: str,
    service: str = 'sendgrid',
    subject: Optional[str] = None,
    body: Optional[str] = None,
) -> bool:
    """
    Send report via email using configured email service
    
    Args:
        recipient_email: Recipient email address
        report_file: BytesIO object with report content
        report_name: Name of the report file
        sender_email: Sender email address
        api_key: Email service API key
        service: Email service ('sendgrid', 'mailgun', 'smtp')
        subject: Email subject (optional)
        body: Email body text (optional)
    
    Returns:
        True if sent successfully, False otherwise
    """
    try:
        if service == 'sendgrid':
            return _send_via_sendgrid(
                recipient_email,
                report_file,
                report_name,
                sender_email,
                api_key,
                subject,
                body
            )
        elif service == 'mailgun':
            return _send_via_mailgun(
                recipient_email,
                report_file,
                report_name,
                sender_email,
                api_key,
                subject,
                body
            )
        elif service == 'smtp':
            return _send_via_smtp(
                recipient_email,
                report_file,
                report_name,
                sender_email,
                api_key,
                subject,
                body
            )
        else:
            logger.error(f"Unknown email service: {service}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def _send_via_sendgrid(
    recipient_email: str,
    report_file: BytesIO,
    report_name: str,
    sender_email: str,
    api_key: str,
    subject: Optional[str] = None,
    body: Optional[str] = None,
) -> bool:
    """Send email via SendGrid"""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
        import base64
    except ImportError:
        logger.error("SendGrid package not installed. Install with: pip install sendgrid")
        return False
    
    # Default subject and body
    if not subject:
        subject = 'Report from Parko Fleet Management'
    if not body:
        body = f'''
        Hello,
        
        Please find attached the report from Parko Fleet Management System.
        
        Best regards,
        Parko Team
        '''
    
    try:
        # Create message
        message = Mail(
            from_email=sender_email,
            to_emails=recipient_email,
            subject=subject,
            plain_text_content=body
        )
        
        # Attach file
        report_file.seek(0)
        file_content = base64.b64encode(report_file.read()).decode()
        
        attachment = Attachment(
            FileContent(file_content),
            FileName(report_name),
            FileType('application/octet-stream'),
            Disposition('attachment'),
        )
        message.attachment = attachment
        
        # Send
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        logger.info(f"SendGrid email sent successfully. Status code: {response.status_code}")
        return response.status_code == 202
        
    except Exception as e:
        logger.error(f"SendGrid error: {e}")
        return False


def _send_via_mailgun(
    recipient_email: str,
    report_file: BytesIO,
    report_name: str,
    sender_email: str,
    api_key: str,
    subject: Optional[str] = None,
    body: Optional[str] = None,
) -> bool:
    """Send email via Mailgun"""
    try:
        import requests
    except ImportError:
        logger.error("Requests package not installed")
        return False
    
    # Default values
    if not subject:
        subject = 'Report from Parko Fleet Management'
    if not body:
        body = f'''
        Hello,
        
        Please find attached the report from Parko Fleet Management System.
        
        Best regards,
        Parko Team
        '''
    
    try:
        # Mailgun API endpoint (you'll need to configure your domain)
        # This is a placeholder - user needs to configure their Mailgun domain
        api_url = "https://api.mailgun.net/v3/YOUR_DOMAIN/messages"
        
        # Prepare files
        report_file.seek(0)
        files = [
            ("attachment", (report_name, report_file, "application/octet-stream"))
        ]
        
        data = {
            "from": f"Parko Reports <{sender_email}>",
            "to": [recipient_email],
            "subject": subject,
            "text": body,
        }
        
        response = requests.post(
            api_url,
            auth=("api", api_key),
            data=data,
            files=files
        )
        
        logger.info(f"Mailgun email sent successfully. Status code: {response.status_code}")
        return response.status_code == 200
        
    except Exception as e:
        logger.error(f"Mailgun error: {e}")
        return False


def _send_via_smtp(
    recipient_email: str,
    report_file: BytesIO,
    report_name: str,
    sender_email: str,
    api_key: str,
    subject: Optional[str] = None,
    body: Optional[str] = None,
) -> bool:
    """
    Send email via SMTP
    Note: api_key should be the SMTP password
    """
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders

    # Default values
    if not subject:
        subject = 'Report from Parko Fleet Management'
    if not body:
        body = f'''
        Hello,
        
        Please find attached the report from Parko Fleet Management System.
        
        Best regards,
        Parko Team
        '''

    try:
        # SMTP configuration (using Gmail as default)
        # Users should configure their own SMTP settings
        smtp_server = "smtp.gmail.com"
        smtp_port = 587

        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = subject

        # Add body
        msg.attach(MIMEText(body, 'plain'))

        # Attach file
        report_file.seek(0)
        part = MIMEBase('application', "octet-stream")
        part.set_payload(report_file.read())
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="{report_name}"'
        )
        msg.attach(part)

        # Send
        logger.info(f"Connecting to SMTP server: {smtp_server}:{smtp_port}")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.set_debuglevel(1)  # Enable debug output
        server.starttls()
        logger.info(f"Attempting to login with email: {sender_email}")
        server.login(sender_email, api_key)
        logger.info(f"Sending email to: {recipient_email}")
        server.send_message(msg)
        server.quit()
        
        logger.info(f"SMTP email sent successfully to {recipient_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}")
        logger.error("This usually means incorrect password or app-specific password required")
        return False
    except smtplib.SMTPConnectError as e:
        logger.error(f"Failed to connect to SMTP server: {e}")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected SMTP error: {e}")
        logger.exception("Full traceback:")
        return False
